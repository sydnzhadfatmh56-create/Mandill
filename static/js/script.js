// عناصر DOM
const promptInput = document.getElementById('prompt');
const generateBtn = document.getElementById('generate-btn');
const charCountSpan = document.getElementById('char-count');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const successDiv = document.getElementById('success');
const successMessage = document.getElementById('success-message');
const resultDiv = document.getElementById('result');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const newBtn = document.getElementById('new-btn');
const historyDiv = document.getElementById('history');

let currentImageUrl = '';
let currentImageName = '';

// تحديث عدد الأحرف
promptInput.addEventListener('input', (e) => {
    charCountSpan.textContent = e.target.value.length;
});

// توليد الصورة
generateBtn.addEventListener('click', generateImage);

// تحميل الصورة
downloadBtn.addEventListener('click', downloadImage);

// إنشاء جديد
newBtn.addEventListener('click', resetForm);

// إدخال بلا Enter
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        generateImage();
    }
});

// دالة تولید تصویر
async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('لطفاً توضیح تصویر را وارد کنید');
        return;
    }

    if (prompt.length < 5) {
        showError('توضیح باید حداقل 5 حرف داشته باشد');
        return;
    }

    // پنهان کردن تمام پیام‌ها
    hideMessages();
    
    // نمایش بارگذاری
    showLoading();
    
    // غیرفعال کردن دکمه
    generateBtn.disabled = true;
    promptInput.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'خطایی رخ داد');
        }

        // ذخیره نام تصویر برای دانلود
        currentImageUrl = data.image_url;
        currentImageName = data.image_url.split('/').pop();

        // نمایش تصویر
        generatedImage.src = data.image_url;
        
        hideLoading();
        resultDiv.style.display = 'block';
        
        showSuccess('تصویر با موفقیت تولید شد! ✨');
        
        // بارگذاری تاریخچه
        loadHistory();

    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError(error.message);
    } finally {
        // فعال‌سازی دکمه
        generateBtn.disabled = false;
        promptInput.disabled = false;
    }
}

// دانلود تصویر
async function downloadImage() {
    if (!currentImageName) return;

    try {
        const response = await fetch(`/api/download/${currentImageName}`);
        if (!response.ok) throw new Error('خطا در دانلود');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentImageName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess('تصویر دانلود شد! 📥');
    } catch (error) {
        showError('خطا در دانلود: ' + error.message);
    }
}

// بازنشانی فرم
function resetForm() {
    promptInput.value = '';
    charCountSpan.textContent = '0';
    resultDiv.style.display = 'none';
    hideMessages();
    promptInput.focus();
}

// نمایش پیام خطا
function showError(message) {
    errorMessage.textContent = message;
    errorDiv.style.display = 'flex';
    errorDiv.style.animation = 'fadeIn 0.3s ease';
}

// نمایش پیام موفقیت
function showSuccess(message) {
    successMessage.textContent = message;
    successDiv.style.display = 'block';
    successDiv.style.animation = 'fadeIn 0.3s ease';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// پنهان کردن پیام‌ها
function hideMessages() {
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
}

// نمایش بارگذاری
function showLoading() {
    resultDiv.style.display = 'none';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.flexDirection = 'column';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';
}

// پنهان کردن بارگذاری
function hideLoading() {
    loadingDiv.style.display = 'none';
}

// نمایش خطای بستن
function closeError() {
    errorDiv.style.display = 'none';
}

// بارگذاری تاریخچه
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
            historyDiv.innerHTML = data.images.map(img => `
                <div class="history-item">
                    <img src="${img.url}" alt="تصویر تاریخچه" loading="lazy">
                    <div class="history-overlay">
                        <div class="history-actions">
                            <button class="history-btn" onclick="viewImage('${img.url}')">👁️</button>
                            <a href="${img.url}" download class="history-btn" style="text-decoration: none;">📥</a>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            historyDiv.innerHTML = '<p class="no-history">هنوز تصویری تولید نشده است</p>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// نمایش تصویر
function viewImage(imageUrl) {
    generatedImage.src = imageUrl;
    currentImageUrl = imageUrl;
    currentImageName = imageUrl.split('/').pop();
    resultDiv.style.display = 'block';
    
    // اسکرول به نتیجه
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// بارگذاری تاریخچه در شروع
window.addEventListener('load', () => {
    loadHistory();
    
    // بررسی وضعیت API
    checkApiStatus();
});

// بررسی وضعیت API
async function checkApiStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (!data.api_configured) {
            showError('⚠️ هشدار: OpenAI API Key تنظیم نشده است. لطفاً فایل .env را بررسی کنید');
        }
    } catch (error) {
        console.error('Error checking API status:', error);
    }
}

// بهبود رابط کاربری
document.addEventListener('DOMContentLoaded', () => {
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                viewImage(item.querySelector('img').src);
            }
        });
    });
});

console.log('%cخوش‌آمدید به Mandil! ✨', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%cتولید تصاویر فوق‌العاده از متن با هوش مصنوعی', 'color: #ec4899; font-size: 14px;');
