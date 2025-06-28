import os
import sys
import tqdm
import open3d as o3d
import trimesh
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from utils.utils_mp import start_process_pool
import utils.utils as utils


def compute_mean_curvature(points, normals, k=30):
    """计算点云的平均曲率"""
    mean_curvature = np.zeros(points.shape[0])
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.normals = o3d.utility.Vector3dVector(normals)

    for i in tqdm.tqdm(range(points.shape[0])):
        # 找到邻域点
        pcd_tree = o3d.geometry.KDTreeFlann(pcd)
        [_, idx, _] = pcd_tree.search_knn_vector_3d(pcd.points[i], k)

        # 计算法向量的变化
        normal_sum = np.zeros(3)
        for j in idx:
            normal_sum += normals[j]

        # 计算平均法向量
        mean_normal = normal_sum / len(idx)

        # 计算平均曲率
        mean_curvature[i] = np.linalg.norm(mean_normal - normals[i]) / 2  # 简单估算

    return mean_curvature


def data_with_mean_curvature(mesh_path, input_path, sample_pt_num=10000):
    print(mesh_path)

    try:
        # 加载并归一化网格
        mesh = trimesh.load_mesh(mesh_path, process=False, force='mesh')
        mesh = utils.normalize_mesh_export(mesh)

        # 采样点和法向量
        pts, idx = trimesh.sample.sample_surface(mesh, count=sample_pt_num)
        normals = mesh.face_normals[idx]


        # 计算平均曲率
        mean_curvature = compute_mean_curvature(pts, normals)

        # 创建 Open3D 点云对象
        pts_o3d = o3d.geometry.PointCloud()
        pts_o3d.points = o3d.utility.Vector3dVector(pts)
        pts_o3d.normals = o3d.utility.Vector3dVector(normals)

        # 将平均曲率信息添加为点的附加属性
        f_name = os.path.splitext(mesh_path.split('/')[-1])[0]
        ply_file_path = os.path.join(input_path, f_name + '_with_mean_curvature.ply')

        # 将曲率值用于点的颜色
        normalized_curvature = (mean_curvature - np.min(mean_curvature)) / (
                    np.max(mean_curvature) - np.min(mean_curvature))
        pts_o3d.colors = o3d.utility.Vector3dVector(np.stack([normalized_curvature] * 3, axis=-1))

        # 保存点云（包括曲率）
        o3d.io.write_point_cloud(ply_file_path, pts_o3d)

        return
    except Exception as e:
        print(e)
        print('error', mesh_path)


if __name__ == "__main__":
    gt_path = '/home/runqiao/NeurCADRecon/data/fandisk/gt'
    os.makedirs(gt_path, exist_ok=True)

    input_path = '/home/runqiao/NeurCADRecon/data/fandisk/input'
    os.makedirs(input_path, exist_ok=True)

    num_processes = 16
    sample_pt_num = 30000

    call_params = list()
    for f in tqdm.tqdm(sorted(os.listdir(gt_path))):
        if os.path.splitext(f)[1] not in ['.ply', '.obj', '.off']:
            continue

        mesh_path = os.path.join(gt_path, f)
        call_params.append((mesh_path, input_path, sample_pt_num))

    start_process_pool(data_with_mean_curvature, call_params, num_processes)
