from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import requests
from datetime import datetime
from pathlib import Path
import io

# بارگذاری متغیرهای محیطی
load_dotenv()

app = Flask(__name__)
CORS(app)

# تنظیم OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')

# ایجاد پوشه‌ی ذخیره‌سازی تصاویر
IMAGES_DIR = Path('static/images')
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

@app.route('/')
def index():
    """صفحه اصلی"""
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_image():
    """تولید تصویر از متن"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        
        if not prompt:
            return jsonify({'error': 'لطفاً توضیح تصویر را وارد کنید'}), 400
        
        if len(prompt) < 5:
            return jsonify({'error': 'توضیح باید حداقل 5 حرف داشته باشد'}), 400
        
        if len(prompt) > 1000:
            return jsonify({'error': 'توضیح نباید بیش از 1000 حرف باشد'}), 400
        
        # تولید تصویر با DALL-E
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024",
            quality="standard"
        )
        
        image_url = response['data'][0]['url']
        
        # دانلود و ذخیره‌سازی تصویر
        image_response = requests.get(image_url)
        if image_response.status_code == 200:
            # نام فایل با تاریخ و ساعت
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'image_{timestamp}.png'
            filepath = IMAGES_DIR / filename
            
            with open(filepath, 'wb') as f:
                f.write(image_response.content)
            
            return jsonify({
                'success': True,
                'image_url': f'/static/images/{filename}',
                'prompt': prompt,
                'timestamp': timestamp
            })
        else:
            return jsonify({'error': 'خطا در دانلود تصویر'}), 500
    
    except openai.error.InvalidRequestError:
        return jsonify({'error': 'متن وارد شده نامناسب است. لطفاً دوباره تلاش کنید'}), 400
    except openai.error.RateLimitError:
        return jsonify({'error': 'محدودیت درخواست‌ها فعال است. لطفاً بعداً تلاش کنید'}), 429
    except openai.error.AuthenticationError:
        return jsonify({'error': 'خطا در احراز هویت API. لطفاً OpenAI API Key را بررسی کنید'}), 401
    except Exception as e:
        return jsonify({'error': f'خطا: {str(e)}'}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """دریافت تاریخچه تصاویر تولید شده"""
    try:
        images = sorted(IMAGES_DIR.glob('*.png'), key=lambda x: x.stat().st_mtime, reverse=True)
        image_list = [
            {
                'url': f'/static/images/{img.name}',
                'name': img.name,
                'size': img.stat().st_size
            }
            for img in images[:20]  # آخرین 20 تصویر
        ]
        return jsonify({'images': image_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_image(filename):
    """دانلود تصویر"""
    try:
        filepath = IMAGES_DIR / filename
        if not filepath.exists():
            return jsonify({'error': 'فایل یافت نشد'}), 404
        
        return send_file(filepath, mimetype='image/png', as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """بررسی سلامت برنامه"""
    api_key_exists = bool(os.getenv('OPENAI_API_KEY'))
    return jsonify({
        'status': 'healthy',
        'api_configured': api_key_exists
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
