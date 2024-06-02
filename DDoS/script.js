let selectedPort = 80;
let attackInterval;
let logInterval;
let isAttacking = false;
let progressInterval;

// 选择端口号
function selectPort(port) {
    selectedPort = port;
    document.getElementById('custom-port').value = '';
    document.getElementById('display-port').value = port;
    document.getElementById('display-port').classList.remove('placeholder');
    checkRequiredFields();
    console.log('Selected port:', selectedPort);
}

// 确认自定义端口号
function confirmCustomPort() {
    const customPort = document.getElementById('custom-port').value;
    if (customPort) {
        selectedPort = customPort;
        document.getElementById('display-port').value = customPort;
        document.getElementById('display-port').classList.remove('placeholder');
        checkRequiredFields();
        console.log('Custom port:', selectedPort);
    }
}

// 显示攻击方法描述
function showDescription() {
    const descriptions = {
        'udp-flood': 'UDP Flood：<span style="color: #FF5733;">攻击通过发送大量的 UDP 数据包到目标服务器，使其无法处理合法流量。</span>',
        'http-flood': 'HTTP Flood：<span style="color: #FF5733;">攻击通过发送大量的 HTTP 请求来使目标服务器过载，无法处理正常流量。</span>',
        'slowloris': 'Slowloris：<span style="color: #FF5733;">攻击通过与目标服务器建立多个部分连接，使其保持开放状态，直到服务器资源耗尽。</span>',
        'loic': 'LOIC：<span style="color: #FF5733;">(Low Orbit Ion Cannon) 是一种简单的 DoS 攻击工具，允许用户通过 GUI 发送大量请求。</span>',
        'hoic': 'HOIC：<span style="color: #FF5733;">(High Orbit Ion Cannon) 是 LOIC 的增强版本，能够生成更大的流量和更多的攻击线程。</span>',
    };

    const attackMode = document.getElementById('attack-mode').value;
    const requestMethod = document.getElementById('request-method').value;
    const description = `${descriptions[attackMode]}<span style="color: #39db7f;">请求方法：${requestMethod}</span>`;
    
    // 应用HTML方法显示内容
    const progressMethodElement = document.getElementById('progress-method');
    progressMethodElement.innerHTML = description;
    progressMethodElement.classList.remove('placeholder');
}


// 更新目标 IP 显示
document.getElementById('target-ip').addEventListener('input', function() {
    const targetIp = document.getElementById('target-ip').value;
    const progressTarget = document.getElementById('progress-target');
    if (targetIp) {
        progressTarget.textContent = targetIp;
        progressTarget.classList.remove('placeholder');
    } else {
        progressTarget.textContent = '这里显示被攻击域名或IP';
        progressTarget.classList.add('placeholder');
    }
    checkRequiredFields();
});

// 检查必填项是否已填写
function checkRequiredFields() {
    const targetIp = document.getElementById('target-ip').value;
    const port = document.getElementById('display-port').value;
    const attackMode = document.getElementById('attack-mode').value;
    const requestMethod = document.getElementById('request-method').value;
    const requestFrequency = document.getElementById('request-frequency').value;

    const startAttackButton = document.getElementById('start-attack');
    if (targetIp && port && attackMode && requestMethod && requestFrequency) {
        startAttackButton.disabled = false;
        startAttackButton.style.cursor = 'pointer';
    } else {
        startAttackButton.disabled = true;
        startAttackButton.style.cursor = 'not-allowed';
    }
}

// 生成随机颜色
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 停止攻击
function stopAttack() {
    clearInterval(attackInterval);
    clearInterval(logInterval);
    clearInterval(progressInterval);
    isAttacking = false;

    // 发送停止攻击请求到服务器
    const targetIp = document.getElementById('target-ip').value;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:5000/stop-attack', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ targetIp: targetIp }));

    const startAttackButton = document.getElementById('start-attack');
    startAttackButton.textContent = '开始攻击';
    startAttackButton.disabled = true;
    startAttackButton.style.cursor = 'not-allowed';
}



// 开始攻击按钮点击事件
document.getElementById('start-attack').addEventListener('click', function() {
    if (isAttacking) {
        stopAttack();
        return;
    }

    const targetIp = document.getElementById('target-ip').value;
    const port = selectedPort;
    const attackMode = document.getElementById('attack-mode').value;
    const requestMethod = document.getElementById('request-method').value;
    const requestFrequency = document.getElementById('request-frequency').value;
    const timeUnit = document.getElementById('time-unit').value;
    const attackDuration = document.getElementById('attack-duration').value;
    const durationUnit = document.getElementById('duration-unit').value;

    const startTime = new Date();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:5000/start-attack', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            document.getElementById('progress-log').textContent = response.log;
            updateResponseLog(response.response); // 更新返回内容
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            document.getElementById('progress-log').textContent = '攻击启动失败';
            stopAttack();
        }
    };
    const data = JSON.stringify({
        targetIp: targetIp,
        port: port,
        attackMode: attackMode,
        requestMethod: requestMethod,
        requestFrequency: requestFrequency,
        timeUnit: timeUnit,
        attackDuration: attackDuration,
        durationUnit: durationUnit
    });
    xhr.send(data);

    // 启用停止按钮
    const startAttackButton = document.getElementById('start-attack');
    startAttackButton.textContent = '停止攻击';
    startAttackButton.disabled = false;
    startAttackButton.style.cursor = 'pointer';
    isAttacking = true;

    // 清除之前的定时器
    clearInterval(attackInterval);
    clearInterval(logInterval);

    // 更新攻击持续时间和次数
    progressInterval = setInterval(() => {
        const now = new Date();
        const elapsedTime = Math.floor((now - startTime) / 1000); // 以秒为单位

        const progressDuration = document.getElementById('progress-duration');
        if (timeUnit === 'seconds') {
            progressDuration.textContent = `${elapsedTime} s`;
        } else {
            progressDuration.textContent = `${Math.floor(elapsedTime / 60)} m`;
        }
        progressDuration.style.color = getRandomColor();
        progressDuration.classList.remove('placeholder');

        // 更新攻击总次数
        const progressCount = document.getElementById('progress-count');
        progressCount.textContent = `攻击总次数：${elapsedTime * requestFrequency}`;
        progressCount.style.color = getRandomColor();
        progressCount.classList.remove('placeholder');
    }, 1000);

    function updateLogContent(log) {
        let logContent = log.join('\n');
    
        // 为特定内容添加颜色
        logContent = logContent.replace(/向 ([^ ]+:[0-9]+)/g, '向 <span style="color:#deafaf;">$1</span>');
        logContent = logContent.replace(/发送 '([^']+)'/g, '发送 <span style="color:green;">\'$1\'</span>');
        logContent = logContent.replace(/(伪IP: \d+\.\d+\.\d+\.\d+)/g, '<span style="color:#007BFF;">$1</span>');
    
        const progressLog = document.getElementById('progress-log');
        progressLog.innerHTML = logContent;
    
        // 始终显示最底部的更新内容
        setTimeout(() => {
            progressLog.scrollTop = progressLog.scrollHeight;
        }, 10); // 添加延迟以确保内容加载后滚动
    }
    
    // 实时获取日志
    logInterval = setInterval(() => {
        const logXhr = new XMLHttpRequest();
        logXhr.open('GET', 'http://127.0.0.1:5000/attack-log', true);
        logXhr.onreadystatechange = function () {
            if (logXhr.readyState === 4 && logXhr.status === 200) {
                const response = JSON.parse(logXhr.responseText);
                updateLogContent(response.log);
            }
        };
        logXhr.send();
    }, 500);

    // 设置攻击时长或次数
    if (attackDuration && durationUnit === 'seconds') {
        setTimeout(stopAttack, attackDuration * 1000);
    } else if (attackDuration && durationUnit === 'minutes') {
        setTimeout(stopAttack, attackDuration * 60 * 1000);
    } else if (attackDuration && durationUnit === 'count') {
        let attackCount = 0;
        attackInterval = setInterval(() => {
            attackCount++;
            if (attackCount >= attackDuration) {
                stopAttack();
            }
        }, 1000 / requestFrequency);
    }
});

document.getElementById('zuo1-image').addEventListener('click', function() {
    openLightbox();
});

function openLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const img = document.getElementById('zuo1-image');
    lightbox.style.display = "flex"; // 使用 flex 布局
    lightboxImg.src = img.src;
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = "none";
}

