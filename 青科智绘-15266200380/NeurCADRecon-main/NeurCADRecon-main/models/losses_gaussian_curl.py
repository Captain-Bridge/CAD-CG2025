import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import utils.utils as utils
from torch.autograd import grad
import itertools


def eikonal_loss(nonmnfld_grad, mnfld_grad, eikonal_type='abs'):
    # Compute the eikonal loss that penalises when ||grad(f)|| != 1 for points on and off the manifold
    # shape is (bs, num_points, dim=3) for both grads
    # Eikonal
    if nonmnfld_grad is not None and mnfld_grad is not None:
        all_grads = torch.cat([nonmnfld_grad, mnfld_grad], dim=-2)
    elif nonmnfld_grad is not None:
        all_grads = nonmnfld_grad
    elif mnfld_grad is not None:
        all_grads = mnfld_grad

    if eikonal_type == 'abs':
        eikonal_term = ((all_grads.norm(2, dim=2) - 1).abs()).mean()
    else:
        eikonal_term = ((all_grads.norm(2, dim=2) - 1).square()).mean()
    # eikonal_term = (-torch.log(all_grads.norm(2, dim=2))).mean()
    return eikonal_term


def relax_eikonal_loss(nonmnfld_grad, mnfld_grad, min=.8, max=0.1, eikonal_type='abs', udf=False):
    # Compute the eikonal loss that penalises when ||grad(f)|| != 1 for points on and off the manifold
    # shape is (bs, num_points, dim=3) for both grads
    # Eikonal
    if nonmnfld_grad is not None and mnfld_grad is not None:
        all_grads = torch.cat([nonmnfld_grad, mnfld_grad], dim=-2)
    elif nonmnfld_grad is not None:
        all_grads = nonmnfld_grad
    elif mnfld_grad is not None:
        all_grads = mnfld_grad

    grad_norm = all_grads.norm(2, dim=-1) + 1e-12
    if udf:
        term = torch.relu((grad_norm - max))
    else:
        term = torch.relu(-(grad_norm - min))
    if eikonal_type == 'abs':
        eikonal_term = term.abs().mean()
    else:
        eikonal_term = term.square().mean()
    # eikonal_term = (-torch.log(grad_norm)).mean()
    return eikonal_term


def smooth_energy(nonmnfld_grad=None, mnfld_grad=None, nonmnfld_hessian_term=None, mnfld_hessian_term=None,
                  energy_type='Dirichlet'):
    if energy_type == 'Dirichlet':
        all_grads = torch.cat([nonmnfld_grad, mnfld_grad], dim=-2)
        term = all_grads.norm(2, dim=-1) + 1e-12
    if energy_type == 'Hessian':
        all_hessian = torch.cat([nonmnfld_hessian_term, mnfld_hessian_term], dim=-2)
        term = all_hessian.norm(2, dim=[-1, -2]) + 1e-12
    if energy_type == 'Hessian_L1':
        all_hessian = torch.cat([nonmnfld_hessian_term, mnfld_hessian_term], dim=-2)
        term = all_hessian.norm(1, dim=[-1, -2]) + 1e-12

    smooth_term = term.abs().mean()

    return smooth_term


def latent_rg_loss(latent_reg, device):
    # compute the VAE latent representation regularization loss
    if latent_reg is not None:
        reg_loss = latent_reg.mean()
    else:
        reg_loss = torch.tensor([0.0], device=device)

    return reg_loss


# from (https://github.com/dsilvavinicius/differential_geometry_in_neural_implicits/blob/master/diff_operators.py)

def hessian(y, x):
    """Hessian of y wrt x

    Parameters
    ----------
    y: torch.Tensor
        Shape [B, N, D_out], where B is the batch size (usually 1), N is the
        number of points, and D_out is the number of output channels of the
        network.

    x: torch.Tensor
        Shape [B, N, D_in],  where B is the batch size (usually 1), N is the
        number of points, and D_in is the number of input channels of the
        network.

    Returns
    -------
    h: torch.Tensor
        Shape: [B, N, D_out, D_in, D_in]
    """
    meta_batch_size, num_observations = y.shape[:2]
    grad_y = torch.ones_like(y[..., 0]).to(y.device)
    h = torch.zeros(meta_batch_size, num_observations, y.shape[-1], x.shape[-1], x.shape[-1]).to(y.device)
    for i in range(y.shape[-1]):
        # calculate dydx over batches for each feature value of y
        dydx = grad(y[..., i], x, grad_y, create_graph=True)[0]

        # calculate hessian on y for each x value
        for j in range(x.shape[-1]):
            tmp = grad(dydx[..., j], x, grad_y, create_graph=True)
            h[..., i, j, :] = tmp[0].unsqueeze(1)[..., :]

    return h


def gaussian_curvature_2(grad, hess):
    ''' curvature of a implicit surface (https://en.wikipedia.org/wiki/Gaussian_curvature#Alternative_formulas).
    '''

    # hess = hessian(morse_nonmnfld_points, morse_nonmnfld_grad)

    # Append gradients to the last columns of the hessians.
    grad5d = torch.unsqueeze(grad, 2)
    grad5d = torch.unsqueeze(grad5d, -1)
    hess = torch.unsqueeze(hess, 2)
    F = torch.cat((hess, grad5d), -1)

    # Append gradients (with and additional 0 at the last coord) to the last lines of the hessians.
    hess_size = hess.size()
    zeros_size = list(itertools.chain.from_iterable((hess_size[:3], [1, 1])))
    zeros = torch.zeros(zeros_size).to(grad.device)
    grad5d = torch.unsqueeze(grad, 2)
    grad5d = torch.unsqueeze(grad5d, -2)
    grad5d = torch.cat((grad5d, zeros), -1)

    F = torch.cat((F, grad5d), -2)
    grad_norm = torch.norm(grad, dim=-1)

    Kg = -torch.det(F)[-1].squeeze(-1) / (grad_norm[0] ** 2)
    return Kg


def gaussian_curvature(nonmnfld_hessian_term, morse_nonmnfld_grad, weight_for_morse=False, morse_weights=None):
    device = morse_nonmnfld_grad.device
    nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, morse_nonmnfld_grad[:, :, :, None]), dim=-1)
    zero_grad = torch.zeros(
        (morse_nonmnfld_grad.shape[0], morse_nonmnfld_grad.shape[1], 1, 1),
        device=device)
    zero_grad = torch.cat((morse_nonmnfld_grad[:, :, None, :], zero_grad), dim=-1)
    nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, zero_grad), dim=-2)
    morse_nonmnfld = (-1. / (morse_nonmnfld_grad.norm(dim=-1) ** 2 + 1e-12)) * torch.det(
        nonmnfld_hessian_term)
    # morse_nonmnfld = (-1. / (torch.clamp(morse_nonmnfld_grad.norm(dim=-1) ** 4, 0.01) + 1e-12)) * torch.det(
    #     nonmnfld_hessian_term)
    # morse_nonmnfld = (-1. / torch.clamp(morse_nonmnfld_grad.norm(dim=-1) ** 4, min=0.1, max=50)) * torch.det(
    #     nonmnfld_hessian_term)

    # print("Min:{}".format(min(min(morse_nonmnfld_grad.norm(dim=-1) ** 4))))
    # print("Max:{}".format(max(max(morse_nonmnfld_grad.norm(dim=-1) ** 4))))

    # f(x)=((1/4 * x^4) - (1/3 * (PI/2 + PI/4) * x^3) +((PI/4) * (PI/4) * x^2) + x/10) * 2
    # morse_nonmnfld = morse_nonmnfld.abs()
    # PI = torch.tensor(torch.pi, dtype=torch.float32).to(device)
    # median_value = PI / 4
    # height_value = torch.tensor(10, dtype=torch.float32).to(device)
    # height_value = torch.tensor(20, dtype=torch.float32).to(device)
    # multiplier_value = torch.tensor(2, dtype=torch.float32).to(device)
    # clamp_morse = torch.clamp(morse_nonmnfld, max=10)
    ## morse_nonmnfld = (((1 / 4) * clamp_morse ** 4) - ((1 / 3) * (PI / 2 + median_value) * clamp_morse ** 3) + (
    ##             (PI / 4) * median_value * clamp_morse ** 2) + clamp_morse / height_value) * multiplier_value
    # morse_loss = morse_nonmnfld.mean()


    # morse_nonmnfld = 2 - 2 * torch.exp(-30 * morse_nonmnfld ** 2) - 1.5 * torch.exp(
    #     -30 * (morse_nonmnfld - torch.pi / 2) ** 2) - 1.5 * torch.exp(-30 * (morse_nonmnfld + torch.pi / 2) ** 2)

    morse_nonmnfld = morse_nonmnfld.abs()
    # weights
    if weight_for_morse and morse_weights is not None:  # use weights
        morse_nonmnfld = morse_weights * morse_nonmnfld


    morse_loss = morse_nonmnfld.mean()

    return morse_loss


def relax_gaussian_curvature(nonmnfld_hessian_term, morse_nonmnfld_grad, weight_for_morse=False, morse_weights=None,
                             max=0.1):
    nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, morse_nonmnfld_grad[:, :, :, None]), dim=-1)
    zero_grad = torch.zeros(
        (morse_nonmnfld_grad.shape[0], morse_nonmnfld_grad.shape[1], 1, 1),
        device=morse_nonmnfld_grad.device)
    zero_grad = torch.cat((morse_nonmnfld_grad[:, :, None, :], zero_grad), dim=-1)
    nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, zero_grad), dim=-2)
    morse_nonmnfld = (-1. / (morse_nonmnfld_grad.norm(dim=-1) ** 2 + 1e-12)) * torch.det(
        nonmnfld_hessian_term)
    morse_nonmnfld = morse_nonmnfld.abs()

    morse_nonmnfld = torch.relu(morse_nonmnfld - max)


    # # weights
    if weight_for_morse and morse_weights is not None:  # use weights
        morse_nonmnfld = morse_weights * morse_nonmnfld

    morse_loss = morse_nonmnfld.mean()

    return morse_loss


def mean_curvature(nonmnfld_hessian_term, morse_nonmnfld_grad):
    morse_nonmnfld_grad_term = morse_nonmnfld_grad[:, :, None, :]
    KM_term_1 = torch.matmul(morse_nonmnfld_grad_term, nonmnfld_hessian_term)

    morse_nonmnfld_grad_term = morse_nonmnfld_grad[:, :, :, None]
    KM_term_1 = torch.matmul(KM_term_1, morse_nonmnfld_grad_term)

    hessian_term_squeeze = nonmnfld_hessian_term.squeeze(0)
    hessian_diag = torch.diagonal(hessian_term_squeeze, dim1=-2, dim2=-1)
    trach_hessian = torch.sum(hessian_diag, dim=-1)[None, :]

    grad_norm = morse_nonmnfld_grad.norm(dim=-1)
    KM_term_2 = (grad_norm ** 2) * trach_hessian

    KM = (KM_term_1 - KM_term_2) / (2 * grad_norm ** 2 + 1e-12)
    KM = KM.abs().mean()
    return KM


class MorseLoss(nn.Module):
    def __init__(self, weights=None, loss_type='siren_wo_n_w_morse', div_decay='none',
                 div_type='l1', bidirectional_morse=True, udf=False, weight_for_morse=False,
                 use_morse_nonmnfld_grad=False, use_relax_eikonal=False):
        super().__init__()
        if weights is None:
            weights = [3e3, 1e2, 1e2, 5e1, 1e2, 1e1]
        self.weights = weights  # sdf, intern, normal, eikonal, div
        self.loss_type = loss_type
        self.div_decay = div_decay
        self.div_type = div_type
        self.use_morse = True if 'morse' in self.loss_type else False
        self.bidirectional_morse = bidirectional_morse
        self.udf = udf
        self.weight_for_morse = weight_for_morse
        self.use_morse_nonmnfld_grad = use_morse_nonmnfld_grad
        self.use_relax_eikonal = use_relax_eikonal

    def forward(self, output_pred, mnfld_points, nonmnfld_points, mnfld_n_gt=None, near_points=None):
        dims = mnfld_points.shape[-1]
        device = mnfld_points.device

        #########################################
        # Compute required terms
        #########################################

        non_manifold_pred = output_pred["nonmanifold_pnts_pred"]
        manifold_pred = output_pred["manifold_pnts_pred"]
        latent_reg = output_pred["latent_reg"]

        div_loss = torch.tensor([0.0], device=mnfld_points.device)
        morse_loss = torch.tensor([0.0], device=mnfld_points.device)
        curv_term = torch.tensor([0.0], device=mnfld_points.device)
        latent_reg_term = torch.tensor([0.0], device=mnfld_points.device)
        normal_term = torch.tensor([0.0], device=mnfld_points.device)
        eikonal_term = torch.tensor([0.0], device=mnfld_points.device)
        min_surf_loss = torch.tensor([0.0], device=mnfld_points.device)
        nonmnfld_hessian_term = torch.tensor([0.0], device=mnfld_points.device)
        mnfld_hessian_term = torch.tensor([0.0], device=mnfld_points.device)

        # compute gradients for div (divergence), curl and curv (curvature)
        if manifold_pred is not None:
            mnfld_grad = utils.gradient(mnfld_points, manifold_pred)
        else:
            mnfld_grad = None

        nonmnfld_grad = utils.gradient(nonmnfld_points, non_manifold_pred)

        morse_nonmnfld_points = None
        morse_nonmnfld_grad = None
        morse_weights = None

        if self.use_morse and near_points is not None:
            morse_nonmnfld_points = near_points
            morse_nonmnfld_grad = utils.gradient(near_points, output_pred['near_points_pred'])
            morse_weights = torch.exp(-1e1 * torch.abs(output_pred['near_points_pred']))


        elif self.use_morse and near_points is None:
            morse_nonmnfld_points = nonmnfld_points
            morse_nonmnfld_grad = nonmnfld_grad
            morse_weights = torch.exp(-1e1 * torch.abs(non_manifold_pred))

        if self.use_morse:
            nonmnfld_dx = utils.gradient(morse_nonmnfld_points, morse_nonmnfld_grad[:, :, 0])
            nonmnfld_dy = utils.gradient(morse_nonmnfld_points, morse_nonmnfld_grad[:, :, 1])

            mnfld_dx = utils.gradient(mnfld_points, mnfld_grad[:, :, 0])
            mnfld_dy = utils.gradient(mnfld_points, mnfld_grad[:, :, 1])
            if dims == 3:
                nonmnfld_dz = utils.gradient(morse_nonmnfld_points, morse_nonmnfld_grad[:, :, 2])
                nonmnfld_hessian_term = torch.stack((nonmnfld_dx, nonmnfld_dy, nonmnfld_dz), dim=-1)

                mnfld_dz = utils.gradient(mnfld_points, mnfld_grad[:, :, 2])
                mnfld_hessian_term = torch.stack((mnfld_dx, mnfld_dy, mnfld_dz), dim=-1)
            else:
                nonmnfld_hessian_term = torch.stack((nonmnfld_dx, nonmnfld_dy), dim=-1)
                mnfld_hessian_term = torch.stack((mnfld_dx, mnfld_dy), dim=-1)

            nonmnfld_det = torch.det(nonmnfld_hessian_term)
            mnfld_det = torch.det(mnfld_hessian_term)

            morse_mnfld = torch.tensor([0.0], device=mnfld_points.device)
            morse_nonmnfld = torch.tensor([0.0], device=mnfld_points.device)
            if self.div_type == 'l2':
                morse_nonmnfld = nonmnfld_det.square().mean()
                if self.bidirectional_morse:
                    morse_mnfld = mnfld_det.square().mean()
            elif self.div_type == 'l1':
                # print(1)
                # gaussian curv

                # morse_nonmnfld = gaussian_curvature(morse_nonmnfld_grad, nonmnfld_hessian_term)
                # morse_nonmnfld = morse_nonmnfld.abs()

                morse_loss = gaussian_curvature(nonmnfld_hessian_term, morse_nonmnfld_grad,
                                                weight_for_morse=self.weight_for_morse, morse_weights=morse_weights)

                # nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, morse_nonmnfld_grad[:, :, :, None]), dim=-1)
                # zero_grad = torch.zeros(
                #     (morse_nonmnfld_grad.shape[0], morse_nonmnfld_grad.shape[1], 1, 1),
                #     device=morse_nonmnfld_grad.device)
                # zero_grad = torch.cat((morse_nonmnfld_grad[:, :, None, :], zero_grad), dim=-1)
                # nonmnfld_hessian_term = torch.cat((nonmnfld_hessian_term, zero_grad), dim=-2)
                # morse_nonmnfld = (-1. / (morse_nonmnfld_grad.norm(dim=-1) ** 2 + 1e-12)) * torch.det(
                #     nonmnfld_hessian_term)
                # morse_nonmnfld = morse_nonmnfld.abs()
                # # morse_nonmnfld = torch.sqrt(morse_nonmnfld)  # the sqrt is to make the loss more stable - from Xin
                #
                # # # weights
                # if self.weight_for_morse and morse_weights is not None:  # use weights
                #     morse_nonmnfld = morse_weights * morse_nonmnfld
                # morse_loss = morse_nonmnfld.mean()

                # dir energy
                # morse_nonmnfld = morse_nonmnfld_grad.norm(dim=-1).square().mean()

                # hessian energy
                # morse_nonmnfld = nonmnfld_hessian_term.norm(p=2, dim=[-1, -2]).mean()

                # divergence (avg curvature)
                # nonmnfld_divergence = nonmnfld_dx[:, :, 0] + nonmnfld_dy[:, :, 1] + nonmnfld_dz[:, :, 2]
                # morse_nonmnfld = torch.clamp(torch.abs(nonmnfld_divergence), 0.1, 50).mean()

                # morse_loss = morse_nonmnfld.mean()
                # morse_loss = morse_nonmnfld
                if self.bidirectional_morse:
                    # gaussian curv
                    # mnfld_hessian_term = torch.cat((mnfld_hessian_term, mnfld_grad[:, :, :, None]),
                    #                                dim=-1)
                    # zero_grad = torch.zeros(
                    #     (mnfld_grad.shape[0], mnfld_grad.shape[1], 1, 1),
                    #     device=mnfld_grad.device)
                    # zero_grad = torch.cat((mnfld_grad[:, :, None, :], zero_grad), dim=-1)
                    # mnfld_hessian_term = torch.cat((mnfld_hessian_term, zero_grad), dim=-2)
                    # morse_mnfld = (-1. / (mnfld_grad.norm(dim=-1) ** 2 + 1e-12)) * torch.det(
                    #     mnfld_hessian_term)
                    # morse_mnfld = morse_mnfld.abs().mean()

                    morse_mnfld = gaussian_curvature(mnfld_hessian_term, mnfld_grad)

                    # morse
                    # morse_mnfld = mnfld_det.abs().mean()

                    # dot
                    # morse_mnfld = torch.bmm(mnfld_hessian_term[0],
                    #                         F.normalize(mnfld_grad, dim=-1)[0, :, :, None])
                    # morse_mnfld = morse_mnfld.norm(p=2, dim=-2).mean()

                morse_loss = 0.5 * (morse_loss + morse_mnfld)
        # latent regulariation for multiple shape learning
        latent_reg_term = latent_rg_loss(latent_reg, device)

        # normal term
        if mnfld_n_gt is not None:
            if 'igr' in self.loss_type:
                normal_term = ((mnfld_grad - mnfld_n_gt).abs()).norm(2, dim=1).mean()
            else:
                normal_term = (
                        1 - torch.abs(torch.nn.functional.cosine_similarity(mnfld_grad, mnfld_n_gt, dim=-1))).mean()

        # signed distance function term
        sdf_term = torch.abs(manifold_pred).mean()
        # sdf_term = (torch.abs(manifold_pred) * torch.exp(manifold_pred.abs())).mean()

        # eikonal term
        if self.use_morse_nonmnfld_grad:
            eikonal_term = eikonal_loss(morse_nonmnfld_grad, mnfld_grad=mnfld_grad, eikonal_type='abs')
        elif self.use_relax_eikonal:
            eikonal_term = eikonal_loss(None, mnfld_grad=mnfld_grad, eikonal_type='abs')
        else:
            eikonal_term = eikonal_loss(nonmnfld_grad, mnfld_grad=mnfld_grad, eikonal_type='abs')
        # eikonal_term = eikonal_loss(nonmnfld_grad, mnfld_grad=mnfld_grad, eikonal_type='abs')
        # eikonal_term = eikonal_loss(None, mnfld_grad=mnfld_grad, eikonal_type='abs')

        # useless
        # eikonal_term = eikonal_loss(morse_nonmnfld_grad, mnfld_grad=None, eikonal_type='abs')
        # inter term
        inter_term = torch.exp(-1e2 * torch.abs(non_manifold_pred)).mean()
        #########################################
        # Losses

        # weight for terms
        # weight for inter_term: A small value will rebuild redundant blocks, a large value will rebuild broken blocks
        # weight for eikonal_term: A small value will rebuild broken blocks, a large value will rebuild redundant blocks (hull)
        # weight for morse_term: A small value will rebuild redundant blocks, a large value will rebuild broken blocks
        #########################################

        # losses used in the paper
        if self.loss_type == 'siren':  # SIREN loss
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + \
                   self.weights[2] * normal_term + self.weights[3] * eikonal_term
        elif self.loss_type == 'siren_w_morse':
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + \
                   self.weights[2] * normal_term + self.weights[3] * eikonal_term + \
                   self.weights[4] * morse_loss
        elif self.loss_type == 'siren_wo_n':  # SIREN loss without normal constraint
            self.weights[2] = 0
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term
        elif self.loss_type == 'siren_wo_n_w_morse':
            self.weights[2] = 0
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * morse_loss
        elif self.loss_type == 'siren_wo_n_wo_e_wo_morse':
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term
        elif self.loss_type == 'igr':  # IGR loss
            self.weights[1] = 0
            loss = self.weights[0] * sdf_term + self.weights[2] * normal_term + self.weights[3] * eikonal_term
        elif self.loss_type == 'igr_wo_n':  # IGR without normals loss
            self.weights[1] = 0
            self.weights[2] = 0
            loss = self.weights[0] * sdf_term + self.weights[3] * eikonal_term
        elif self.loss_type == 'igr_wo_n_w_morse':
            self.weights[1] = 0
            self.weights[2] = 0
            loss = self.weights[0] * sdf_term + self.weights[3] * eikonal_term + self.weights[5] * morse_loss
        elif self.loss_type == 'siren_w_div':  # SIREN loss with divergence term
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + \
                   self.weights[2] * normal_term + self.weights[3] * eikonal_term + \
                   self.weights[4] * div_loss
        elif self.loss_type == 'siren_wo_e_w_morse':
            self.weights[3] = 0
            self.weights[4] = 0
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + \
                   self.weights[2] * normal_term + self.weights[5] * morse_loss
        elif self.loss_type == 'siren_wo_e_wo_n_w_morse':
            self.weights[2] = 0
            self.weights[3] = 0
            self.weights[4] = 0
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[5] * morse_loss
        elif self.loss_type == 'siren_wo_n_w_div':  # SIREN loss without normals and with divergence constraint
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[4] * div_loss
        elif self.loss_type == 'siren_wo_n_w_Dirichlet':
            self.weights[2] = 0
            dirichlet_loss = smooth_energy(nonmnfld_grad, mnfld_grad, energy_type='Dirichlet')
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * dirichlet_loss
        elif self.loss_type == 'siren_wo_n_w_Hessian_no_morse':
            self.weights[2] = 0
            hessian_loss = smooth_energy(nonmnfld_hessian_term=nonmnfld_hessian_term,
                                         mnfld_hessian_term=mnfld_hessian_term, energy_type='Hessian')
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * hessian_loss
        elif self.loss_type == 'siren_wo_n_w_HessianL1_no_morse':
            self.weights[2] = 0
            hessianL1_loss = smooth_energy(nonmnfld_hessian_term=nonmnfld_hessian_term,
                                           mnfld_hessian_term=mnfld_hessian_term, energy_type='Hessian_L1')
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * hessianL1_loss
        elif self.loss_type == 'siren_wo_n_w_morse_w_meanCurvature':
            self.weights[2] = 0
            mean_curvature_loss = mean_curvature(nonmnfld_hessian_term, morse_nonmnfld_grad)
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * morse_loss + self.weights[4] * mean_curvature_loss
        elif self.loss_type == 'siren_wo_n_w_morse_w_minsurf':
            tau = 0.5
            min_surf_loss = (0.5 * (1. / np.pi) / (tau ** 2 + output_pred['near_points_pred'] ** 2)).mean()
            loss = self.weights[0] * sdf_term + self.weights[1] * inter_term + self.weights[3] * eikonal_term + \
                   self.weights[5] * morse_loss + self.weights[2] * min_surf_loss

        else:
            print(self.loss_type)
            raise Warning("unrecognized loss type")

        # If multiple surface reconstruction, then latent and latent_reg are defined so reg_term need to be used
        if latent_reg is not None:
            loss += self.weights[6] * latent_reg_term

        return {"loss": loss, 'sdf_term': sdf_term, 'inter_term': inter_term, 'latent_reg_term': latent_reg_term,
                'eikonal_term': eikonal_term, 'normals_loss': normal_term, 'div_loss': div_loss,
                'curv_loss': curv_term.mean(), 'morse_term': morse_loss, 'min_surf_loss': min_surf_loss}, mnfld_grad

    def update_morse_weight(self, current_iteration, n_iterations, params=None):
        # `params`` should be (start_weight, *optional middle, end_weight) where optional middle is of the form [percent, value]*
        # Thus (1e2, 0.5, 1e2 0.7 0.0, 0.0) means that the weight at [0, 0.5, 0.7, 1] of the training process, the weight should
        #   be [1e2,1e2,0.0,0.0]. Between these points, the weights change as per the div_decay parameter, e.g. linearly, quintic, step etc.
        #   Thus the weight stays at 1e2 from 0-0.5, decay from 1e2 to 0.0 from 0.5-0.75, and then stays at 0.0 from 0.75-1.

        if not hasattr(self, 'decay_params_list'):
            assert len(params) >= 2, params
            assert len(params[1:-1]) % 2 == 0
            self.decay_params_list = list(zip([params[0], *params[1:-1][1::2], params[-1]], [0, *params[1:-1][::2], 1]))

        curr = current_iteration / n_iterations
        we, e = min([tup for tup in self.decay_params_list if tup[1] >= curr], key=lambda tup: tup[1])
        w0, s = max([tup for tup in self.decay_params_list if tup[1] <= curr], key=lambda tup: tup[1])

        # Divergence term anealing functions
        if self.div_decay == 'linear':  # linearly decrease weight from iter s to iter e
            if current_iteration < s * n_iterations:
                self.weights[5] = w0
            elif current_iteration >= s * n_iterations and current_iteration < e * n_iterations:
                self.weights[5] = w0 + (we - w0) * (current_iteration / n_iterations - s) / (e - s)
            else:
                self.weights[5] = we
        elif self.div_decay == 'quintic':  # linearly decrease weight from iter s to iter e
            if current_iteration < s * n_iterations:
                self.weights[5] = w0
            elif current_iteration >= s * n_iterations and current_iteration < e * n_iterations:
                self.weights[5] = w0 + (we - w0) * (1 - (1 - (current_iteration / n_iterations - s) / (e - s)) ** 5)
            else:
                self.weights[5] = we
        elif self.div_decay == 'step':  # change weight at s
            if current_iteration < s * n_iterations:
                self.weights[5] = w0
            else:
                self.weights[5] = we
        elif self.div_decay == 'none':
            pass
        else:
            raise Warning("unsupported div decay value")
