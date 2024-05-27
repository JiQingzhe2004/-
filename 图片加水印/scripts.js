document.getElementById('upload-button').addEventListener('click', function() {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('preview');
            preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
            preview.style.width = 'auto'; // 取消固定宽度
            preview.style.height = 'auto'; // 取消固定高度
            preview.style.backgroundColor = 'transparent'; // 取消背景颜色
            document.getElementById('loading').style.display = 'none'; // 隐藏加载动画
        };
        reader.readAsDataURL(file);
        document.getElementById('loading').style.display = 'block'; // 显示加载动画
    }
});

document.querySelectorAll('input[name="watermark"]').forEach((radio) => {
    radio.addEventListener('change', function() {
        document.querySelectorAll('.watermark-option').forEach((option) => {
            option.classList.remove('active');
        });
        const selectedOption = document.getElementById(this.value + '-watermark');
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
    });
});

document.getElementById('add-watermark-button').addEventListener('click', function() {
    document.getElementById('loading').style.display = 'block'; // 显示加载动画
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');
    const img = preview.querySelector('img');

    if (img) {
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = img.src;

        image.onload = function() {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const watermarkType = document.querySelector('input[name="watermark"]:checked').value;

            if (watermarkType === 'text') {
                const text = document.getElementById('watermark-text').value;
                const position = document.getElementById('text-position').value;
                const fontSize = parseInt(document.getElementById('font-size').value, 10);
                const fontColor = document.getElementById('font-color').value;

                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillStyle = fontColor;

                let x, y;
                switch (position) {
                    case 'top-left':
                        x = 100;
                        y = 150;
                        break;
                    case 'top-right':
                        x = canvas.width - ctx.measureText(text).width - 50;
                        y = 150;
                        break;
                    case 'center':
                        x = (canvas.width - ctx.measureText(text).width) / 2;
                        y = (canvas.height + fontSize) / 2;
                        break;
                    case 'bottom-left':
                        x = 50;
                        y = canvas.height - 50;
                        break;
                    case 'bottom-right':
                        x = canvas.width - ctx.measureText(text).width - 50;
                        y = canvas.height - 50;
                        break;
                }

                ctx.fillText(text, x, y);
            } else if (watermarkType === 'image') {
                const watermarkImageFile = document.getElementById('watermark-image').files[0];
                if (watermarkImageFile) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const watermarkImage = new Image();
                        watermarkImage.src = e.target.result;

                        watermarkImage.onload = function() {
                            const position = document.getElementById('image-position').value;
                            const opacity = parseFloat(document.getElementById('image-opacity').value);
                            const size = parseFloat(document.getElementById('image-size').value) / 100;

                            const watermarkWidth = watermarkImage.width * size;
                            const watermarkHeight = watermarkImage.height * size;

                            ctx.globalAlpha = opacity;

                            let x, y;
                            switch (position) {
                                case 'top-left':
                                    x = 50;
                                    y = 50;
                                    break;
                                case 'top-right':
                                    x = canvas.width - watermarkWidth - 50;
                                    y = 50;
                                    break;
                                case 'center':
                                    x = (canvas.width - watermarkWidth) / 2;
                                    y = (canvas.height - watermarkHeight) / 2;
                                    break;
                                case 'bottom-left':
                                    x = 50;
                                    y = canvas.height - watermarkHeight - 50;
                                    break;
                                case 'bottom-right':
                                    x = canvas.width - watermarkWidth - 50;
                                    y = canvas.height - watermarkHeight - 50;
                                    break;
                            }

                            ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
                            ctx.globalAlpha = 1.0;

                            // 更新预览图片
                            const dataURL = canvas.toDataURL('image/png');
                            preview.innerHTML = '<img src="' + dataURL + '" alt="Preview">';
                            document.getElementById('loading').style.display = 'none'; // 隐藏加载动画
                        };
                    };
                    reader.readAsDataURL(watermarkImageFile);
                }
            } else {
                alert('请选择水印类型');
            }

            // 更新预览图片
            const dataURL = canvas.toDataURL('image/png');
            preview.innerHTML = '<img src="' + dataURL + '" alt="Preview">';
            document.getElementById('loading').style.display = 'none'; // 隐藏加载动画
        };
    }
});

document.getElementById('download-button').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'AiQiji.png';
    link.click();
});

document.getElementById('preview').addEventListener('click', function(event) {
    if (event.target.tagName === 'IMG') {
        const lightboxImage = document.getElementById('lightbox-image');
        lightboxImage.src = event.target.src;
        document.getElementById('lightbox').style.display = 'flex';
    }
});

document.getElementById('lightbox').addEventListener('click', function() {
    this.style.display = 'none';
});

document.getElementById('alpha-picker').addEventListener('input', function() {
    const alpha = this.value;
    const textElement = document.getElementById('your-text-element');
    const color = window.getComputedStyle(textElement).color;
    const rgbaColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    textElement.style.color = rgbaColor;
});