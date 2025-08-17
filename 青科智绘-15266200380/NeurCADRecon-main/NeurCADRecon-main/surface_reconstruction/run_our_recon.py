import os
import random
import threading

if __name__ == '__main__':
    # data_path = '/home/runqiao/rotate_input/ALL_COMPLETE_INPUTS'
    data_path = '../../../ABC'
    gt_path = '/home/runqiao/rotate_input/gt'

    # logdir = './new_log/abl_abc_siren_relax'
    logdir = './new_log/CAD_CG_2025'

    # data process
    sample_type = 'gaussian'
    n_points = 10000
    n_samples = 10000
    batch_size = 1
    grid_res = 128
    # network
    layers = 4
    decoder_hidden_dim = 256
    sphere_init_params = (1.6, 0.1)
    init_type = 'siren'  # 'siren' | 'mfgi' | 'all_zero' | 'random'
    # loss
    loss_type = 'siren_wo_n_w_morse'
    # loss_type = 'siren_wo_n'
    # loss_weights = (3e3, 1e2, 1e2, 5e1, 0, 3)
    loss_weights = (7e3, 6e2, 1e2, 5e1, 0, 3)
    # loss_weights = (7e3, 6e2, 1e2, 50, 0, 3, 3e2) ## original
    # loss_weights = (7e3, 6e2, 1e2, 50, 0, 3, 0)
    morse_type = 'l1'
    morse_decay = 'linear'  # 'linear' | 'quintic' | 'step'
    # decay_params = (3, 0.2, 3, 0.4, 0.001, 0)
    # decay_params = (60, 0.2, 60, 0.5, 0.006, 0)
    decay_params = (10.0, 0.2, 10.0, 0.5, 0.1, 0.1)
    # opt
    lr = 5e-5
    grad_clip = 10


    files = list()
    for f in sorted(os.listdir(data_path)):
        files.append(f)
    files = files[:]
    used = list()
    # device_ID = [1, 1, 1]
    device_ID = [0,
                 ]
    # device_ID = [7]
    i = 0
    while True:
        if len(files) == 0:
            break
        if len(device_ID) != 0 and (
                device_ID[i] not in used or device_ID.count(device_ID[i]) > used.count(device_ID[i])):
            f = files.pop(0)

            def sub_thread():
                id = device_ID[i]
                used.append(id)
                os.system(f'CUDA_VISIBLE_DEVICES={id} python train_surface_reconstruction.py \
                          --logdir {logdir} --data_path {os.path.join(data_path, f)} --mesh_dir {os.path.join(gt_path)} --n_samples {n_samples} --n_points {n_points} --grid_res {grid_res} --nonmnfld_sample_type {sample_type} \
                          --lr {lr} --grad_clip_norm {grad_clip} \
                          --init_type {init_type} --decoder_hidden_dim {decoder_hidden_dim} --decoder_n_hidden_layers {layers} \
                          --loss_type {loss_type} --loss_weights {loss_weights[0]} {loss_weights[1]} {loss_weights[2]} {loss_weights[3]} {loss_weights[4]} {loss_weights[5]}\
                          --decay_params {decay_params[0]} {decay_params[1]}  {decay_params[2]} {decay_params[3]} {decay_params[4]} {decay_params[5]} --morse_type {morse_type} --morse_decay {morse_decay}'
                          )

                used.remove(id)


            t = threading.Thread(target=sub_thread)
            t.start()
        i = (i + 1) % len(device_ID)
