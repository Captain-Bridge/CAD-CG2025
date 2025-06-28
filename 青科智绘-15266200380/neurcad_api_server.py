#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NeurCADRecon API服务器
使用指定的虚拟环境运行NeurCADRecon算法
"""

import os
import sys
import json
import subprocess
import threading
import time
from flask import Flask, request, jsonify, Response, stream_template, send_file
from flask_cors import CORS
import traceback
import queue
import tempfile
import uuid
import re

# 设置虚拟环境路径
VIRTUAL_ENV_PATH = os.path.expanduser("~/miniconda3/envs/CrownCAD")
if os.path.exists(VIRTUAL_ENV_PATH):
    # 添加虚拟环境的Python路径
    python_path = os.path.join(VIRTUAL_ENV_PATH, "bin", "python")
    if os.path.exists(python_path):
        sys.executable = python_path
        sys.path.insert(0, os.path.join(VIRTUAL_ENV_PATH, "lib", "python3.7", "site-packages"))

# 添加NeurCADRecon路径
NEURCAD_PATH = os.path.join(os.path.dirname(__file__), "NeurCADRecon-main", "NeurCADRecon-main")
if os.path.exists(NEURCAD_PATH):
    sys.path.insert(0, NEURCAD_PATH)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量存储输出队列
output_queues = {}

# 存储上传的文件信息
uploaded_files = {}

class OutputCapture:
    def __init__(self, queue_id):
        self.queue_id = queue_id
        self.queue = queue.Queue()
        output_queues[queue_id] = self.queue
        # 匹配NeurCAD输出格式: Epoch: 0 [ 220/5000 (4%)] Loss: ...
        self.progress_pattern = re.compile(r'Epoch: (\d+) \[(\s*\d+)/(\d+) \((\d+)%\)\]')
        
    def write(self, text):
        if text.strip():
            # 发送输出日志
            self.queue.put({
                'type': 'output',
                'content': text.strip()
            })
            
            # 解析进度信息
            self._parse_progress(text.strip())
    
    def _parse_progress(self, line):
        """解析NeurCAD输出中的进度信息"""
        match = self.progress_pattern.search(line)
        if match:
            epoch = int(match.group(1))
            current_iter = int(match.group(2))
            total_iter = int(match.group(3))
            percentage = int(match.group(4))
            
            # 发送进度信息
            self.queue.put({
                'type': 'progress',
                'percentage': percentage,
                'message': f'训练中... 迭代 {current_iter}/{total_iter}',
                'currentEpoch': epoch,
                'totalEpochs': epoch + 1,
                'currentIteration': current_iter,
                'totalIterations': total_iter
            })
            
            print(f"解析到进度: Epoch {epoch}, 迭代 {current_iter}/{total_iter} ({percentage}%)")
    
    def flush(self):
        pass

def run_neurcad_reconstruction(config_data, queue_id):
    """在后台线程中运行NeurCAD重建"""
    try:
        print(f"开始重建线程，队列ID: {queue_id}")
        
        # 确保队列存在
        if queue_id not in output_queues:
            print(f"队列 {queue_id} 不存在，创建新队列")
            output_queues[queue_id] = queue.Queue()
        
        # 发送初始进度信息
        output_queues[queue_id].put({
            'type': 'progress',
            'percentage': 0,
            'message': '正在初始化重建环境...',
            'currentEpoch': 0,
            'totalEpochs': 1
        })
        
        # 创建临时配置文件
        config_file = 'temp_config.json'
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"配置文件已创建: {config_file}")
        print(f"配置内容: {config_data}")
        
        # 设置输出捕获
        output_capture = OutputCapture(queue_id)
        
        # 构建命令
        neurcad_dir = os.path.join(os.path.dirname(__file__), "NeurCADRecon-main", "NeurCADRecon-main")
        script_path = os.path.join(neurcad_dir, "surface_reconstruction", "train_surface_reconstruction.py")
        
        print(f"NeurCAD目录: {neurcad_dir}")
        print(f"脚本路径: {script_path}")
        print(f"脚本是否存在: {os.path.exists(script_path)}")
        
        # 保存当前目录
        original_dir = os.getcwd()
        
        # 切换到NeurCAD目录
        os.chdir(neurcad_dir)
        print(f"切换到目录: {os.getcwd()}")
        
        # 检查输入文件
        input_file = config_data.get('input_file', 'input_pld.ply')
        print(f"配置中的输入文件: {input_file}")
        print(f"当前工作目录: {os.getcwd()}")
        print(f"输入文件完整路径: {os.path.abspath(input_file)}")
        print(f"输入文件是否存在: {os.path.exists(input_file)}")
        
        # 列出当前目录文件
        print(f"当前目录文件列表:")
        for file in os.listdir('.'):
            if file.endswith('.ply'):
                print(f"  - {file}")
        
        # 构建Python命令，使用正确的参数格式
        cmd = [
            python_path,  # 使用当前Python解释器
            script_path,
            '--data_path', input_file,
            '--n_samples', str(config_data.get('n_samples', 10000)),
            '--grid_res', str(config_data.get('grid_res', 128)),
            '--lr', str(config_data.get('lr', 5e-05)),
            '--init_type', config_data.get('init_type', 'siren'),
            '--decoder_hidden_dim', str(config_data.get('decoder_hidden_dim', 256)),
            '--decoder_n_hidden_layers', str(config_data.get('decoder_n_hidden_layers', 4)),
            '--morse_type', config_data.get('morse_type', 'l1'),
            '--morse_decay', config_data.get('morse_decay', 'linear'),
            '--loss_weights'
        ]
        
        # 添加loss_weights参数
        loss_weights = config_data.get('loss_weights', [7000, 600, 100, 50, 0, 10])
        cmd.extend([str(w) for w in loss_weights])
        
        print(f"执行命令: {' '.join(cmd)}")
        
        # 启动进程
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        print(f"进程已启动，PID: {process.pid}")
        
        # 实时读取输出
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"NeurCAD输出: {line.strip()}")
                output_capture.write(line)
        
        # 等待进程完成
        return_code = process.wait()
        print(f"进程完成，返回码: {return_code}")
        
        # 读取重建结果文件
        result_mesh_path = os.path.join('reconstruction_results', 'input_pld', 'result_meshes', 'input_pld.ply')
        print(f"查找结果文件: {result_mesh_path}")
        print(f"结果文件是否存在: {os.path.exists(result_mesh_path)}")
        
        # 初始化结果数据
        result_data = {
            'vertex_count': 0,
            'face_count': 0,
            'duration': 0,
            'final_loss': 0.0,
            'convergence_epoch': 0,
            'mesh_quality': 'Unknown',
            'mesh_file_path': result_mesh_path if os.path.exists(result_mesh_path) else None
        }
        
        # 如果结果文件存在，尝试读取网格信息
        if os.path.exists(result_mesh_path):
            try:
                import numpy as np
                from plyfile import PlyData
                
                # 读取PLY文件
                plydata = PlyData.read(result_mesh_path)
                
                # 获取顶点和面信息
                if 'vertex' in plydata:
                    vertex_count = len(plydata['vertex'])
                    result_data['vertex_count'] = vertex_count
                    print(f"读取到顶点数: {vertex_count}")
                    
                    # 提取顶点数据
                    vertices = []
                    for vertex in plydata['vertex']:
                        vertices.extend([float(vertex['x']), float(vertex['y']), float(vertex['z'])])
                    result_data['mesh_data'] = {
                        'vertices': vertices,
                        'faces': [],
                        'normals': []
                    }
                
                if 'face' in plydata:
                    face_count = len(plydata['face'])
                    result_data['face_count'] = face_count
                    print(f"读取到面数: {face_count}")
                    
                    # 提取面数据
                    faces = []
                    for face in plydata['face']:
                        # face 是一个tuple，face[0]是索引数组
                        face_vertices = face[0]
                        faces.extend([int(idx) for idx in face_vertices[:3]])  # 转换为int类型
                    result_data['mesh_data']['faces'] = faces
                
                # 根据顶点和面数评估网格质量
                if vertex_count > 0 and face_count > 0:
                    if face_count / vertex_count > 2.5:
                        result_data['mesh_quality'] = 'High'
                    elif face_count / vertex_count > 1.5:
                        result_data['mesh_quality'] = 'Good'
                    else:
                        result_data['mesh_quality'] = 'Low'
                
                print(f"网格质量评估: {result_data['mesh_quality']}")
                print(f"网格数据已提取: {len(result_data['mesh_data']['vertices'])} 个顶点, {len(result_data['mesh_data']['faces'])} 个面索引")
                
            except Exception as e:
                print(f"读取结果文件时发生错误: {e}")
                import traceback
                traceback.print_exc()
                # 如果无法读取PLY文件，尝试使用其他方法
                try:
                    # 简单的文件大小估算
                    file_size = os.path.getsize(result_mesh_path)
                    if file_size > 1000000:  # 大于1MB
                        result_data['mesh_quality'] = 'Good'
                    elif file_size > 100000:  # 大于100KB
                        result_data['mesh_quality'] = 'Medium'
                    else:
                        result_data['mesh_quality'] = 'Low'
                    print(f"基于文件大小评估质量: {result_data['mesh_quality']} (文件大小: {file_size} 字节)")
                except:
                    pass
        else:
            print(f"警告: 结果文件不存在: {result_mesh_path}")
            # 列出reconstruction_results目录内容
            try:
                results_dir = os.path.join('reconstruction_results')
                if os.path.exists(results_dir):
                    print(f"reconstruction_results目录内容:")
                    for root, dirs, files in os.walk(results_dir):
                        for file in files:
                            if file.endswith('.ply'):
                                print(f"  - {os.path.join(root, file)}")
            except Exception as e:
                print(f"列出目录内容时发生错误: {e}")
        
        # 发送100%进度
        if queue_id in output_queues:
            output_queues[queue_id].put({
                'type': 'progress',
                'percentage': 100,
                'message': '重建完成！正在生成结果...',
                'currentEpoch': 0,
                'totalEpochs': 1
            })
        
        # 发送完成信号，包含真实的结果数据
        if queue_id in output_queues:
            output_queues[queue_id].put({
                'type': 'complete',
                'result': result_data
            })
        
        # 清理
        os.chdir(os.path.dirname(neurcad_dir))
        os.chdir(original_dir)
        if os.path.exists(config_file):
            os.remove(config_file)
            
    except Exception as e:
        print(f"重建过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        # 确保队列存在后再发送错误信息
        if queue_id in output_queues:
            output_queues[queue_id].put({
                'type': 'error',
                'error': str(e)
            })
        else:
            print(f"无法发送错误信息，队列 {queue_id} 不存在")

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'python_path': sys.executable,
        'python_version': sys.version,
        'neurcad_initialized': bool(output_queues),
        'virtual_env': VIRTUAL_ENV_PATH
    })

@app.route('/api/upload-pointcloud', methods=['POST'])
def upload_pointcloud():
    """上传点云文件"""
    try:
        print("收到点云文件上传请求")
        
        # 检查是否有文件数据
        if 'file' not in request.files:
            print("没有文件数据")
            return jsonify({
                'success': False,
                'error': '没有文件数据'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            print("文件名为空")
            return jsonify({
                'success': False,
                'error': '文件名为空'
            }), 400
        
        print(f"上传文件: {file.filename}")
        
        # 生成唯一文件ID
        file_id = str(uuid.uuid4())
        
        # 获取NeurCAD目录
        neurcad_dir = os.path.join(os.path.dirname(__file__), "NeurCADRecon-main", "NeurCADRecon-main")
        
        # 保存文件到NeurCAD目录，使用简洁的文件名
        filename = 'input_pld.ply'  # 固定文件名，覆盖之前的文件
        file_path = os.path.join(neurcad_dir, filename)
        
        print(f"保存文件到: {file_path}")
        
        # 保存文件
        file.save(file_path)
        
        # 检查文件是否保存成功
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"文件保存成功，大小: {file_size} 字节")
            
            # 存储文件信息
            uploaded_files[file_id] = {
                'filename': filename,
                'original_name': file.filename,
                'file_path': file_path,
                'file_size': file_size,
                'upload_time': time.time()
            }
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'filename': filename,
                'file_size': file_size,
                'message': '文件上传成功'
            })
        else:
            print("文件保存失败")
            return jsonify({
                'success': False,
                'error': '文件保存失败'
            }), 500
            
    except Exception as e:
        print(f"上传文件时发生错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/list-uploaded-files', methods=['GET'])
def list_uploaded_files():
    """列出已上传的文件"""
    try:
        files = []
        for file_id, file_info in uploaded_files.items():
            files.append({
                'file_id': file_id,
                'filename': file_info['filename'],
                'original_name': file_info['original_name'],
                'file_size': file_info['file_size'],
                'upload_time': file_info['upload_time']
            })
        
        return jsonify({
            'success': True,
            'files': files
        })
        
    except Exception as e:
        print(f"列出文件时发生错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/neurcad/execute-local', methods=['POST'])
def execute_local_reconstruction():
    """启动本地NeurCAD重建"""
    try:
        data = request.json
        config_content = data.get('config')
        params = data.get('params')
        file_id = data.get('file_id')  # 使用文件ID而不是缓存文件数据
        
        print(f"收到重建请求，文件ID: {file_id}")
        
        # 检查文件是否存在
        if file_id and file_id in uploaded_files:
            file_info = uploaded_files[file_id]
            print(f"找到上传文件: {file_info['filename']}")
            print(f"文件路径: {file_info['file_path']}")
            print(f"文件大小: {file_info['file_size']} 字节")
        else:
            print(f"警告: 文件ID {file_id} 不存在，将使用默认文件")
            file_id = None
        
        # 解析配置
        config_data = json.loads(config_content)
        
        # 设置输入文件路径
        if file_id and file_id in uploaded_files:
            config_data['input_file'] = uploaded_files[file_id]['filename']
            print(f"使用上传文件: {config_data['input_file']}")
        else:
            config_data['input_file'] = 'input_pld.ply'
            print(f"使用默认文件: {config_data['input_file']}")
        
        # 生成唯一的队列ID
        queue_id = f"reconstruction_{int(time.time())}"
        
        # 在后台线程中启动重建
        thread = threading.Thread(
            target=run_neurcad_reconstruction,
            args=(config_data, queue_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'queue_id': queue_id,
            'message': '重建已启动',
            'input_file': config_data['input_file']
        })
        
    except Exception as e:
        print(f"执行重建时发生错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/neurcad/stream-output')
def stream_output():
    """SSE流式输出"""
    queue_id = request.args.get('queue_id')  # 在request context有效时获取
    print(f"SSE流请求，queue_id: {queue_id}")
    
    def generate(queue_id):
        if not queue_id:
            print("SSE流错误: 未提供queue_id")
            yield f"data: {json.dumps({'type': 'error', 'error': 'Queue ID not provided'})}\n\n"
            return
            
        if queue_id not in output_queues:
            print(f"SSE流错误: 队列 {queue_id} 不存在")
            yield f"data: {json.dumps({'type': 'error', 'error': f'Queue {queue_id} not found'})}\n\n"
            return

        q = output_queues[queue_id]
        print(f"开始SSE流，队列ID: {queue_id}")

        try:
            while True:
                try:
                    data = q.get(timeout=1)
                    print(f"SSE发送数据: {data.get('type', 'unknown')}")
                    yield f"data: {json.dumps(data)}\n\n"
                    
                    if data.get('type') in ['complete', 'error']:
                        print(f"重建完成，结束SSE流: {queue_id}")
                        # 延迟清理，确保前端收到
                        import time
                        time.sleep(2)
                        if queue_id in output_queues:
                            del output_queues[queue_id]
                            print(f"已清理队列: {queue_id}")
                        break
                except queue.Empty:
                    # 发送心跳保持连接
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
        except Exception as e:
            print(f"SSE流错误: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        finally:
            print(f"SSE流结束: {queue_id}")

    return Response(
        generate(queue_id), 
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )

@app.route('/api/neurcad/get-mesh-data', methods=['GET'])
def get_mesh_data():
    """获取重建的网格数据"""
    try:
        # 获取NeurCAD目录
        neurcad_dir = os.path.join(os.path.dirname(__file__), "NeurCADRecon-main", "NeurCADRecon-main")
        
        # 查找最新的重建结果文件（使用绝对路径）
        result_mesh_path = os.path.join(neurcad_dir, 'reconstruction_results', 'input_pld', 'result_meshes', 'input_pld.ply')
        
        if not os.path.exists(result_mesh_path):
            return jsonify({
                'success': False,
                'error': '重建结果文件不存在'
            }), 404
        
        print(f"读取网格文件: {result_mesh_path}")
        
        # 读取PLY文件
        import numpy as np
        from plyfile import PlyData
        
        plydata = PlyData.read(result_mesh_path)
        
        # 提取顶点数据
        vertices = []
        if 'vertex' in plydata:
            for vertex in plydata['vertex']:
                vertices.extend([float(vertex['x']), float(vertex['y']), float(vertex['z'])])
        
        # 提取面数据
        faces = []
        if 'face' in plydata:
            for face in plydata['face']:
                # face 是一个tuple，face[0]是索引数组
                face_vertices = face[0]
                faces.extend([int(idx) for idx in face_vertices[:3]])  # 转换为int类型
        
        print(f"提取到 {len(vertices)//3} 个顶点, {len(faces)//3} 个面")
        
        return jsonify({
            'success': True,
            'mesh_data': {
                'vertices': vertices,
                'faces': faces,
                'vertex_count': len(vertices) // 3,
                'face_count': len(faces) // 3
            }
        })
        
    except Exception as e:
        print(f"读取网格数据时发生错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/neurcad/download-result', methods=['GET'])
def download_reconstruction_result():
    """下载重建结果文件"""
    try:
        # 获取NeurCAD目录
        neurcad_dir = os.path.join(os.path.dirname(__file__), "NeurCADRecon-main", "NeurCADRecon-main")
        
        # 重建结果文件路径
        result_mesh_path = os.path.join(neurcad_dir, 'reconstruction_results', 'input_pld', 'result_meshes', 'input_pld.ply')
        
        print(f"请求下载重建结果文件: {result_mesh_path}")
        print(f"文件是否存在: {os.path.exists(result_mesh_path)}")
        
        if not os.path.exists(result_mesh_path):
            return jsonify({
                'success': False,
                'error': '重建结果文件不存在'
            }), 404
        
        # 返回文件
        return send_file(
            result_mesh_path,
            as_attachment=True,
            download_name='reconstructed_mesh.ply',
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        print(f"下载重建结果时发生错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f"NeurCADRecon API服务器启动")
    print(f"Python路径: {sys.executable}")
    print(f"Python版本: {sys.version}")
    print(f"虚拟环境: {VIRTUAL_ENV_PATH}")
    print(f"NeurCAD路径: {NEURCAD_PATH}")
    
    # 启动服务器
    app.run(host='0.0.0.0', port=5001, debug=True) 