import glob
import os
import shutil
import warnings

warnings.filterwarnings("ignore")

import tqdm
import numpy as np
import open3d as o3d
import pandas as pd
import trimesh

from scipy.spatial import KDTree
from scipy import stats

from sklearn import neighbors

import utils_mp

import argparse


def compute_completeness_coverage(rec_mesh, gt_mesh, sample_density=10000):
    """
    计算完整性：网格覆盖GT模型主体区域比率
    
    Args:
        rec_mesh: 重建网格
        gt_mesh: 真实网格
        sample_density: 采样密度
    
    Returns:
        coverage_ratio: 覆盖率 (0-1)
    """
    # 从GT网格采样点
    gt_points, _ = gt_mesh.sample(sample_density, return_index=True)
    
    # 构建重建网格的KDTree
    rec_tree = KDTree(rec_mesh.vertices)
    
    # 计算每个GT点到重建网格的最短距离
    distances, _ = rec_tree.query(gt_points, k=1)
    
    # 定义覆盖阈值（可以根据需要调整）
    coverage_threshold = 0.01  # 1% of mesh diameter
    
    # 计算覆盖率
    covered_points = np.sum(distances <= coverage_threshold)
    coverage_ratio = covered_points / len(gt_points)
    
    return coverage_ratio


def compute_detail_preservation(rec_mesh, gt_mesh, curvature_threshold=0.1):
    """
    计算细节保留：尖锐特征处的豪斯多夫距离
    
    Args:
        rec_mesh: 重建网格
        gt_mesh: 真实网格
        curvature_threshold: 曲率阈值，用于识别尖锐特征
    
    Returns:
        detail_hausdorff: 尖锐特征处的豪斯多夫距离
    """
    # 计算GT网格的曲率
    gt_curvatures = gt_mesh.vertex_defects
    
    # 识别尖锐特征点（高曲率区域）
    sharp_features_mask = gt_curvatures > np.percentile(gt_curvatures, 90)
    sharp_feature_points = gt_mesh.vertices[sharp_features_mask]
    
    if len(sharp_feature_points) == 0:
        return 0.0
    
    # 构建重建网格的KDTree
    rec_tree = KDTree(rec_mesh.vertices)
    
    # 计算尖锐特征点到重建网格的距离
    distances, _ = rec_tree.query(sharp_feature_points, k=1)
    
    # 返回最大距离（豪斯多夫距离）
    detail_hausdorff = np.max(distances)
    
    return detail_hausdorff


def compute_topological_integrity(mesh):
    """
    计算拓扑完整性：检查无非流形边、孔洞等
    
    Args:
        mesh: 输入网格
    
    Returns:
        dict: 包含各种拓扑完整性指标
    """
    try:
        # 检查非流形边
        nonmanifold_edges = mesh.edges_unique[mesh.edges_unique_length > 2]
        nonmanifold_edge_count = len(nonmanifold_edges)
    except:
        nonmanifold_edge_count = 0
    
    try:
        # 检查孔洞
        holes = mesh.fill_holes()
        hole_count = len(holes) if holes is not None else 0
    except:
        hole_count = 0
    
    try:
        # 检查边界边
        boundary_edges = mesh.edges_unique[mesh.edges_unique_length == 1]
        boundary_edge_count = len(boundary_edges)
    except:
        boundary_edge_count = 0
    
    # 检查网格是否封闭
    try:
        is_watertight = mesh.is_watertight
    except:
        is_watertight = False
    
    # 检查网格是否可定向
    try:
        is_winding_consistent = mesh.is_winding_consistent
    except:
        is_winding_consistent = False
    
    return {
        'nonmanifold_edge_count': nonmanifold_edge_count,
        'hole_count': hole_count,
        'boundary_edge_count': boundary_edge_count,
        'is_watertight': is_watertight,
        'is_winding_consistent': is_winding_consistent,
        'topological_score': 1.0 if (nonmanifold_edge_count == 0 and hole_count == 0 and is_watertight) else 0.0
    }


def compute_mesh_quality(mesh):
    """
    计算网格质量：三角正则性(最小角，边长比)
    
    Args:
        mesh: 输入网格
    
    Returns:
        dict: 包含网格质量指标
    """
    # 计算三角形的最小角
    vertices = mesh.vertices
    faces = mesh.faces
    
    min_angles = []
    aspect_ratios = []
    
    for face in faces:
        # 获取三角形的三个顶点
        v1, v2, v3 = vertices[face]
        
        # 计算边长
        a = np.linalg.norm(v2 - v1)
        b = np.linalg.norm(v3 - v2)
        c = np.linalg.norm(v1 - v3)
        
        # 计算角度（使用余弦定理）
        if a > 0 and b > 0 and c > 0:
            cos_A = (b**2 + c**2 - a**2) / (2 * b * c)
            cos_B = (a**2 + c**2 - b**2) / (2 * a * c)
            cos_C = (a**2 + b**2 - c**2) / (2 * a * b)
            
            # 限制余弦值在[-1, 1]范围内
            cos_A = np.clip(cos_A, -1, 1)
            cos_B = np.clip(cos_B, -1, 1)
            cos_C = np.clip(cos_C, -1, 1)
            
            angles = np.arccos([cos_A, cos_B, cos_C])
            min_angle = np.min(angles)
            min_angles.append(min_angle)
            
            # 计算边长比（最长边/最短边）
            sides = [a, b, c]
            aspect_ratio = max(sides) / min(sides)
            aspect_ratios.append(aspect_ratio)
    
    min_angles = np.array(min_angles)
    aspect_ratios = np.array(aspect_ratios)
    
    return {
        'min_angle_mean': np.mean(min_angles),
        'min_angle_min': np.min(min_angles),
        'min_angle_std': np.std(min_angles),
        'aspect_ratio_mean': np.mean(aspect_ratios),
        'aspect_ratio_max': np.max(aspect_ratios),
        'aspect_ratio_std': np.std(aspect_ratios),
        'quality_score': np.mean(min_angles) / np.pi * 3  # 归一化到[0,1]
    }


def compute_geometric_accuracy(rec_mesh, gt_mesh, sample_density=10000):
    """
    计算几何准确性：生成模型与GT模型的几何误差
    
    Args:
        rec_mesh: 重建网格
        gt_mesh: 真实网格
        sample_density: 采样密度
    
    Returns:
        dict: 包含几何准确性指标
    """
    # 从GT网格采样点
    gt_points, _ = gt_mesh.sample(sample_density, return_index=True)
    
    # 构建重建网格的KDTree
    rec_tree = KDTree(rec_mesh.vertices)
    
    # 计算每个GT点到重建网格的最短距离
    distances, _ = rec_tree.query(gt_points, k=1)
    
    # 计算统计指标
    max_error = np.max(distances)
    mean_error = np.mean(distances)
    std_error = np.std(distances)
    median_error = np.median(distances)
    
    # 计算百分位数
    p95_error = np.percentile(distances, 95)
    p99_error = np.percentile(distances, 99)
    
    return {
        'max_error': max_error,
        'mean_error': mean_error,
        'std_error': std_error,
        'median_error': median_error,
        'p95_error': p95_error,
        'p99_error': p99_error
    }


def compute_normal_consistency_error(rec_mesh, gt_mesh, sample_density=10000):
    """
    计算法相一致性误差
    
    Args:
        rec_mesh: 重建网格
        gt_mesh: 真实网格
        sample_density: 采样密度
    
    Returns:
        dict: 包含法相一致性误差指标
    """
    # 从两个网格采样点和法向量
    gt_points, gt_face_indices = gt_mesh.sample(sample_density, return_index=True)
    rec_points, rec_face_indices = rec_mesh.sample(sample_density, return_index=True)
    
    # 获取法向量
    gt_normals = gt_mesh.face_normals[gt_face_indices]
    rec_normals = rec_mesh.face_normals[rec_face_indices]
    
    # 构建KDTree用于最近邻搜索
    gt_tree = KDTree(gt_points)
    rec_tree = KDTree(rec_points)
    
    # 计算从重建点到GT点的最近邻
    rec_to_gt_dist, rec_to_gt_idx = gt_tree.query(rec_points, k=1)
    
    # 计算法向量差异
    normal_differences = []
    for i, gt_idx in enumerate(rec_to_gt_idx):
        # 计算法向量的点积（余弦相似度）
        dot_product = np.dot(rec_normals[i], gt_normals[gt_idx])
        # 限制在[-1, 1]范围内
        dot_product = np.clip(dot_product, -1, 1)
        # 转换为角度误差
        angle_error = np.arccos(np.abs(dot_product))  # 使用绝对值处理方向问题
        normal_differences.append(angle_error)
    
    normal_differences = np.array(normal_differences)
    
    return {
        'normal_error_mean': np.mean(normal_differences),
        'normal_error_std': np.std(normal_differences),
        'normal_error_max': np.max(normal_differences),
        'normal_error_median': np.median(normal_differences),
        'normal_consistency_score': 1.0 - np.mean(normal_differences) / np.pi  # 归一化到[0,1]
    }


def eval_reconstruct_gt_pts(rec_mesh_path, gt_mesh_path, name, args):
    def normalize_mesh_export(mesh, file_out=None):
        bounds = mesh.extents
        if bounds.min() == 0.0:
            return mesh

        # translate to origin
        translation = (mesh.bounds[0] + mesh.bounds[1]) * 0.5
        translation = trimesh.transformations.translation_matrix(direction=-translation)
        mesh.apply_transform(translation)

        # scale to unit cube
        scale = 1.0 / bounds.max()
        scale_trafo = trimesh.transformations.scale_matrix(factor=scale)
        mesh.apply_transform(scale_trafo)
        if file_out is not None:
            mesh.export(file_out)
        return mesh, scale

    def get_threshold_percentage(dist, thresholds):
        ''' Evaluates a point cloud.
        Args:
            dist (numpy array): calculated distance
            thresholds (numpy array): threshold values for the F-score calculation
        '''
        in_threshold = [
            (dist <= t).mean() if (dist <= t).any() else 0 for t in thresholds
        ]
        return in_threshold

    def distance_p2p(points_src, normals_src, points_tgt, normals_tgt):
        ''' Computes minimal distances of each point in points_src to points_tgt.

        Args:
            points_src (numpy array): source points
            normals_src (numpy array): source normals
            points_tgt (numpy array): target points
            normals_tgt (numpy array): target normals
        '''
        kdtree = KDTree(points_tgt)
        dist, idx = kdtree.query(points_src, workers=-1)

        if normals_src is not None and normals_tgt is not None:
            normals_src = \
                normals_src / np.linalg.norm(normals_src, axis=-1, keepdims=True)
            normals_tgt = \
                normals_tgt / np.linalg.norm(normals_tgt, axis=-1, keepdims=True)

            #        normals_dot_product = (normals_tgt[idx] * normals_src).sum(axis=-1)
            #        # Handle normals that point into wrong direction gracefully
            #        # (mostly due to mehtod not caring about this in generation)
            #        normals_dot_product = np.abs(normals_dot_product)

            normals_dot_product = np.abs(normals_tgt[idx] * normals_src)
            normals_dot_product = normals_dot_product.sum(axis=-1)
        else:
            normals_dot_product = np.array(
                [np.nan] * points_src.shape[0], dtype=np.float32)
        return dist, normals_dot_product

    def compute_hausdorff_distance(points_src, points_tgt):
        ''' Computes Hausdorff distance between two point clouds.
        
        Args:
            points_src (numpy array): source points
            points_tgt (numpy array): target points
        '''
        # Build KDTree for target points
        kdtree_tgt = KDTree(points_tgt)
        kdtree_src = KDTree(points_src)
        
        # Compute distances from source to target
        dist_src_to_tgt, _ = kdtree_tgt.query(points_src, k=1)
        # Compute distances from target to source
        dist_tgt_to_src, _ = kdtree_src.query(points_tgt, k=1)
        
        # Hausdorff distance is the maximum of the two directional distances
        hausdorff_distance = max(np.max(dist_src_to_tgt), np.max(dist_tgt_to_src))
        
        return hausdorff_distance

    def eval_mesh(pointcloud, pointcloud_tgt,
                  normals=None, normals_tgt=None, thresholds=[0.005]):
        ''' Evaluates a point cloud.

        Args:
            pointcloud (numpy array): predicted point cloud
            pointcloud_tgt (numpy array): target point cloud
            normals (numpy array): predicted normals
            normals_tgt (numpy array): target normals
        '''
        # Return maximum losses if pointcloud is empty

        pointcloud = np.asarray(pointcloud)
        pointcloud_tgt = np.asarray(pointcloud_tgt)

        # Completeness: how far are the points of the target point cloud
        # from thre predicted point cloud
        completeness, completeness_normals = distance_p2p(
            pointcloud_tgt, normals_tgt, pointcloud, normals
        )
        recall = get_threshold_percentage(completeness, thresholds)
        completeness2 = completeness ** 2

        completeness = completeness.mean()
        completeness2 = completeness2.mean()
        completeness_normals = completeness_normals.mean()

        # Accuracy: how far are th points of the predicted pointcloud
        # from the target pointcloud
        accuracy, accuracy_normals = distance_p2p(
            pointcloud, normals, pointcloud_tgt, normals_tgt
        )
        precision = get_threshold_percentage(accuracy, thresholds)
        accuracy2 = accuracy ** 2

        accuracy = accuracy.mean()
        accuracy2 = accuracy2.mean()
        accuracy_normals = accuracy_normals.mean()
        
        # Compute Hausdorff distance
        hausdorff_distance = compute_hausdorff_distance(pointcloud, pointcloud_tgt)
        
        # print(completeness,accuracy,completeness2,accuracy2)
        # Chamfer distance
        chamferL2 = 0.5 * (completeness2 + accuracy2)
        normals_correctness = (
                0.5 * completeness_normals + 0.5 * accuracy_normals
        )
        chamferL1 = 0.5 * (completeness + accuracy)

        # F-Score
        F = [
            2 * precision[i] * recall[i] / (precision[i] + recall[i] + 1e-12)
            for i in range(len(precision))
        ]
        return normals_correctness, chamferL1, chamferL2, F[0], hausdorff_distance

    def get_ecd_ef1(pts_rec, pts_gt, normals_rec, normals_gt):

        # sample gt edge points
        gt_tree = neighbors.KDTree(pts_gt)
        indslist = gt_tree.query_radius(pts_gt, args.ef1_radius)
        flags = np.zeros([len(pts_gt)], np.bool)
        for p in range(len(pts_gt)):
            inds = indslist[p]
            if len(inds) > 0:
                this_normals = normals_gt[p:p + 1]
                neighbor_normals = normals_gt[inds]
                dotproduct = np.abs(np.sum(this_normals * neighbor_normals, axis=1))
                if np.any(dotproduct < args.ef1_dotproduct_threshold):
                    flags[p] = True
        gt_edge_points = np.ascontiguousarray(pts_gt[flags])

        # sample pred edge points
        pred_tree = neighbors.KDTree(pts_rec)
        indslist = pred_tree.query_radius(pts_rec, args.ef1_radius)
        flags = np.zeros([len(pts_rec)], np.bool)
        for p in range(len(pts_rec)):
            inds = indslist[p]
            if len(inds) > 0:
                this_normals = normals_rec[p:p + 1]
                neighbor_normals = normals_rec[inds]
                dotproduct = np.abs(np.sum(this_normals * neighbor_normals, axis=1))
                if np.any(dotproduct < args.ef1_dotproduct_threshold):
                    flags[p] = True
        pred_edge_points = np.ascontiguousarray(pts_rec[flags])

        # write_ply_point("temp/"+str(idx)+"_gt.ply", gt_edge_points)
        # write_ply_point("temp/"+str(idx)+"_pred.ply", pred_edge_points)

        # ecd ef1

        if len(pred_edge_points) == 0: pred_edge_points = np.zeros([486, 3], np.float32)
        if len(gt_edge_points) == 0:
            ecd = 0
            ef1 = 1
        else:
            # from gt to pred
            tree = KDTree(pred_edge_points)
            dist, inds = tree.query(gt_edge_points, k=1)
            recall = np.sum(dist < args.ef1_threshold) / float(len(dist))
            dist = np.square(dist)
            gt2pred_mean_ecd = np.mean(dist)

            # from pred to gt
            tree = KDTree(gt_edge_points)
            dist, inds = tree.query(pred_edge_points, k=1)
            precision = np.sum(dist < args.ef1_threshold) / float(len(dist))
            dist = np.square(dist)
            pred2gt_mean_ecd = np.mean(dist)

            ecd = gt2pred_mean_ecd + pred2gt_mean_ecd
            if recall + precision > 0:
                ef1 = 2 * recall * precision / (recall + precision)
            else:
                ef1 = 0

        return ecd, ef1

    try:
        rec_mesh = trimesh.load(rec_mesh_path, process=False)
        if isinstance(rec_mesh, trimesh.Scene):
            rec_mesh = trimesh.load(rec_mesh_path, process=True, force='mesh')
        gt_mesh = trimesh.load(gt_mesh_path, process=False)
        if isinstance(gt_mesh, trimesh.Scene):
            gt_mesh = trimesh.load(gt_mesh_path, process=True, force='mesh')
        gt_mesh, gt_scale = normalize_mesh_export(gt_mesh, gt_mesh_path)
        # rec_mesh.apply_transform(trans)
        # rec_mesh.apply_transform(scale)
        # rec_mesh.export(rec_mesh_path)
        rec_mesh, rec_scale = normalize_mesh_export(rec_mesh, rec_mesh_path)
    except Exception:
        print(rec_mesh_path)

    # if gt_pts.shape[0] < args.sample_num:
    #     args.sample_num = gt_pts.shape[0]
    # sample point for rec
    try:
        pts_rec, idx = rec_mesh.sample(args.sample_num, return_index=True)
    except Exception as e:
        print(e)
        print(rec_mesh_path, rec_mesh)
    normals_rec = rec_mesh.face_normals[idx]

    pts_gt = None
    normals_gt = None
    if isinstance(gt_mesh, trimesh.PointCloud):
        normals_gt = None
        pts_o3d = o3d.io.read_point_cloud(gt_mesh_path)
        normals_gt = np.array(pts_o3d.normals)
        pts_gt = np.array(gt_mesh.vertices)
        idx = np.random.choice(pts_gt.shape[0], args.sample_num, replace=False)
        if normals_gt.shape[0] != 0:
            normals_gt = normals_gt[idx]
        else:
            normals_gt = None
        pts_gt = pts_gt[idx]
    else:
        # sample point for gt
        pts_gt, idx = gt_mesh.sample(args.sample_num, return_index=True)
        normals_gt = gt_mesh.face_normals[idx]
    
    normals_correctness, chamferL1, chamferL2, f1_mu, hausdorff_distance = eval_mesh(pts_rec, pts_gt, normals_rec, normals_gt)

    # Convert distances to mm units
    # Since the meshes are normalized to unit cube, we need to convert back to original scale
    # We'll estimate the original scale based on typical CAD object sizes
    
    # Estimate original scale based on typical CAD object dimensions
    # For dental/CAD objects, typical sizes are in the range of 10-100mm
    # You can adjust this based on your specific use case
    
    # Method 1: Use a fixed scale based on typical object size
    typical_object_size_mm = args.scale_factor_mm  # Use command line argument
    
    # Method 2: If you have access to original unscaled data, you can calculate the actual scale
    # original_scale_mm = actual_object_size_mm / normalized_object_size
    
    # Method 3: Use the scale factors from normalization if available
    # Since the meshes are normalized to unit cube, we'll use the command line scale factor
    # This gives you control over the conversion based on your actual data scale
    original_scale_mm = typical_object_size_mm
    
    # Convert all distance metrics to mm
    chamferL1_mm = chamferL1 * original_scale_mm
    chamferL2_mm = chamferL2 * original_scale_mm
    hausdorff_distance_mm = hausdorff_distance * original_scale_mm
    
    # Calculate true error (mean absolute error) in mm
    true_error_mm = chamferL1_mm

    # euler number
    euler_num = gt_mesh.euler_number - rec_mesh.euler_number
    euler_num = np.abs(euler_num)

    # CD and f1 for the points on the edges
    ecd, ef1 = get_ecd_ef1(pts_rec, pts_gt, normals_rec, normals_gt)

    # 计算新的评估指标
    print(f"计算 {name} 的详细评估指标...")
    
    # 1. 完整性：网格覆盖GT模型主体区域比率
    completeness_coverage = compute_completeness_coverage(rec_mesh, gt_mesh, args.sample_num)
    
    # 2. 细节保留：尖锐特征处的豪斯多夫距离
    detail_hausdorff = compute_detail_preservation(rec_mesh, gt_mesh)
    
    # 3. 拓扑完整性：无非流形边、孔洞
    rec_topology = compute_topological_integrity(rec_mesh)
    gt_topology = compute_topological_integrity(gt_mesh)
    
    # 4. 网格质量：三角正则性
    rec_quality = compute_mesh_quality(rec_mesh)
    gt_quality = compute_mesh_quality(gt_mesh)
    
    # 5. 几何准确性：生成模型与GT模型的几何误差
    geometric_accuracy = compute_geometric_accuracy(rec_mesh, gt_mesh, args.sample_num)
    
    # 6. 法相一致性误差
    normal_consistency = compute_normal_consistency_error(rec_mesh, gt_mesh, args.sample_num)

    out_dict = dict()
    out_dict['name'] = name
    
    # 原有指标
    out_dict['normals_correctness'] = normals_correctness
    out_dict['chamferL1'] = chamferL1
    out_dict['chamferL2'] = chamferL2
    out_dict['f1_mu'] = f1_mu
    out_dict['euler_num'] = euler_num
    out_dict['ecd'] = ecd
    out_dict['ef1'] = ef1
    out_dict['hausdorff_distance_mm'] = hausdorff_distance_mm
    out_dict['true_error_mm'] = true_error_mm
    
    # 新增指标
    # 1. 完整性
    out_dict['completeness_coverage'] = completeness_coverage
    
    # 2. 细节保留
    out_dict['detail_hausdorff'] = detail_hausdorff
    out_dict['detail_hausdorff_mm'] = detail_hausdorff * original_scale_mm
    
    # 3. 拓扑完整性
    out_dict['rec_nonmanifold_edges'] = rec_topology['nonmanifold_edge_count']
    out_dict['rec_holes'] = rec_topology['hole_count']
    out_dict['rec_boundary_edges'] = rec_topology['boundary_edge_count']
    out_dict['rec_is_watertight'] = rec_topology['is_watertight']
    out_dict['rec_is_winding_consistent'] = rec_topology['is_winding_consistent']
    out_dict['rec_topological_score'] = rec_topology['topological_score']
    
    # 4. 网格质量
    out_dict['rec_min_angle_mean'] = rec_quality['min_angle_mean']
    out_dict['rec_min_angle_min'] = rec_quality['min_angle_min']
    out_dict['rec_aspect_ratio_mean'] = rec_quality['aspect_ratio_mean']
    out_dict['rec_aspect_ratio_max'] = rec_quality['aspect_ratio_max']
    out_dict['rec_quality_score'] = rec_quality['quality_score']
    
    # 5. 几何准确性
    out_dict['geometric_max_error'] = geometric_accuracy['max_error']
    out_dict['geometric_mean_error'] = geometric_accuracy['mean_error']
    out_dict['geometric_std_error'] = geometric_accuracy['std_error']
    out_dict['geometric_median_error'] = geometric_accuracy['median_error']
    out_dict['geometric_p95_error'] = geometric_accuracy['p95_error']
    out_dict['geometric_p99_error'] = geometric_accuracy['p99_error']
    
    # 转换为mm单位
    out_dict['geometric_max_error_mm'] = geometric_accuracy['max_error'] * original_scale_mm
    out_dict['geometric_mean_error_mm'] = geometric_accuracy['mean_error'] * original_scale_mm
    out_dict['geometric_std_error_mm'] = geometric_accuracy['std_error'] * original_scale_mm
    out_dict['geometric_median_error_mm'] = geometric_accuracy['median_error'] * original_scale_mm
    out_dict['geometric_p95_error_mm'] = geometric_accuracy['p95_error'] * original_scale_mm
    out_dict['geometric_p99_error_mm'] = geometric_accuracy['p99_error'] * original_scale_mm
    
    # 6. 法相一致性
    out_dict['normal_error_mean'] = normal_consistency['normal_error_mean']
    out_dict['normal_error_std'] = normal_consistency['normal_error_std']
    out_dict['normal_error_max'] = normal_consistency['normal_error_max']
    out_dict['normal_consistency_score'] = normal_consistency['normal_consistency_score']
    
    return out_dict


def check_recon_mesh(mesh_path, method_name, unrecon_data_path):
    is_unrecon_mesh = False

    mesh = trimesh.load_mesh(mesh_path, process=False)

    is_not_mesh = not (isinstance(mesh, trimesh.Scene) or isinstance(mesh, trimesh.Trimesh))
    is_invalid_mesh = (mesh.area == 0)

    if is_not_mesh or is_invalid_mesh:
        unrecon_save_path = os.path.join(unrecon_data_path, method_name)
        os.makedirs(unrecon_save_path, exist_ok=True)

        shutil.copy(mesh_path, unrecon_save_path)
        is_unrecon_mesh = True

    return is_unrecon_mesh


if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=str, default='/home/baixiao/CrownCAD/input_output_GT/output/')
    parser.add_argument('--sample_num', type=int, default=100000)
    parser.add_argument('--f1_threshold', type=float, default=0.003)
    parser.add_argument('--ef1_radius', type=float, default=0.004)
    parser.add_argument('--ef1_dotproduct_threshold', type=float, default=0.2)
    parser.add_argument('--ef1_threshold', type=float, default=0.005)
    parser.add_argument('--scale_factor_mm', type=float, default=50.0, 
                       help='Scale factor to convert normalized distances to mm (default: 50.0)')
    parser.add_argument('--skip', action="store_true", help='Skip existing files')
    args = parser.parse_args()

    input_root_path = args.input
    # exp_name = input_root_path.split('/')[4]
    exp_name = ''
    # exp_name = 'Thingi10K'
    # exp_name = 'Roomx'
    # exp_name = 'Large'
    # exp_name = 'Car'
    # exp_name = 'SRB'

    # gt_path = os.path.join(input_root_path, 'gt')
    gt_path = '/home/baixiao/CrownCAD/input_output_GT/GT/'

    # unrecon_data_path = os.path.join(input_root_path, 'unrecon_data')
    # os.makedirs(unrecon_data_path, exist_ok=True)

    num_processes = 32
    evaluation_dataframes = []
    print(input_root_path)
    for f in tqdm.tqdm(sorted(os.listdir(input_root_path))):
        print(f)
        input_path = os.path.join(input_root_path, f)
        call_params = list()
        if os.path.splitext(input_path)[1] not in ['.ply', '.obj', '.off']:
            continue
        pred_mesh_name = os.path.join(input_root_path, f)

        # check if the mesh has been reconstructed and move the un-reconstruction meshes to 'unrecon_data' folder
        # is_unrecon_mesh = check_recon_mesh(pred_mesh_name, f, unrecon_data_path)
        # if is_unrecon_mesh:
        #     continue

            # if name != 'ours' and name != 'ours_old':
            #     gt_name = glob.glob(os.path.join(gt_path, f.split('.')[0] + '*'))[0]
            # else:
            #     gt_name = glob.glob(os.path.join(gt_path, f.split('_iter_')[0] + '*'))[0]
            # name = name.split('.')[0]
        print(f)
        for gt in os.listdir(gt_path):
            if gt.split('.')[0] in f:
                gt_name = gt
                print('find gt', gt_name)
        gt_name = os.path.join(gt_path, gt_name)
        call_params.append((pred_mesh_name, gt_name, f, args))

        eval_dicts = utils_mp.start_process_pool(eval_reconstruct_gt_pts, call_params, num_processes)
        eval_df = pd.DataFrame(eval_dicts)
        evaluation_dataframes.append(eval_df)  # 将每个评估结果的数据帧添加到列表中

    data = pd.concat(evaluation_dataframes, ignore_index=True)

    # 生成 CSV 文件路径
    out_file_class = os.path.join(input_root_path, f'eval_meshes_{exp_name}.csv')

    # 计算均值和标准差

    # 排除非数值列
    numeric_columns = data.select_dtypes(include=np.number).columns
    mean_se = data[numeric_columns].mean()
    std_se = data[numeric_columns].std()
    mean_se['name'] = 'mean'
    std_se['name'] = 'std'

    # 将均值和标准差添加到数据帧末尾
    data = data._append(mean_se, ignore_index=True)
    data = data._append(std_se, ignore_index=True)

    # 保存为 CSV 文件
    print(data)
    print(out_file_class)

    data.to_csv(out_file_class, index=False)  # 禁止保存索引
