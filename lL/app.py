from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from PIL import Image
import pydicom
import nibabel as nib
import numpy as np
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'medical-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medical_platform.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

db = SQLAlchemy(app)

# إعدادات رفع الملفات
ALLOWED_EXTENSIONS = {
    'dcm': 'DICOM',
    'nii': 'NIFTI',
    'gz': 'NIFTI_GZ',
    'png': 'PNG',
    'jpg': 'JPEG',
    'jpeg': 'JPEG'
}

# النماذج
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'doctor' or 'nurse'
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # العلاقات
    posts = db.relationship('Post', backref='author', lazy=True)
    replies = db.relationship('Reply', backref='doctor', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class MedicalImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # dicom, nii, png, jpg
    file_size = db.Column(db.Integer, nullable=False)
    preview_filename = db.Column(db.String(255))  # اسم ملف المعاينة PNG
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'upload_date': self.upload_date.strftime('%Y-%m-%d %H:%M') if self.upload_date else None,
            'url': f'/static/uploads/medical_images/{self.filename}',
            'preview_url': f'/static/uploads/medical_images/{self.preview_filename}' if self.preview_filename else None
        }

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    urgency = db.Column(db.String(20), default='normal')  # low, normal, high, critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # العلاقات
    replies = db.relationship('Reply', backref='post', lazy=True, cascade="all, delete-orphan")
    medical_images = db.relationship('MedicalImage', backref='post', lazy=True, cascade="all, delete-orphan")

class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    medical_proces=db.Column(db.String(50), nullable=False)
    medical_cate=db.Column(db.String(50), nullable=False)

# إنشاء الجداول
with app.app_context():
    db.create_all()

# دوال مساعدة لرفع الملفات
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS









def convert_to_preview(file_path, extension, original_filename):
    """تحويل ملفات DICOM/NIFTI إلى PNG للعرض"""
    try:
        preview_filename = f"{os.path.splitext(original_filename)[0]}_preview.png"
        preview_path = os.path.join('static', 'uploads', 'medical_images', preview_filename)
        
        if extension == 'dcm':
            # قراءة ملف DICOM
            dicom_data = pydicom.dcmread(file_path)
            
            if hasattr(dicom_data, 'pixel_array'):
                # تحويل البيانات إلى صورة
                image_array = dicom_data.pixel_array
                
                # تطبيع البيانات
                if image_array.dtype != np.uint8:
                    image_array = image_array.astype(np.float32)
                    image_array = (image_array - image_array.min()) / (image_array.max() - image_array.min()) * 255
                    image_array = image_array.astype(np.uint8)
                
                # إذا كانت الصورة 3D، نأخذ شريحة من المنتصف
                if len(image_array.shape) == 3:
                    slice_idx = image_array.shape[2] // 2
                    image_slice = image_array[:, :, slice_idx]
                elif len(image_array.shape) == 2:
                    image_slice = image_array
                else:
                    return None
                
                # حفظ الصورة
                img = Image.fromarray(image_slice)
                img.save(preview_path)
                return preview_filename
                
        elif extension in ['nii', 'gz']:
            # قراءة ملف NIFTI
            nii_img = nib.load(file_path)
            image_data = nii_img.get_fdata()
            
            # تطبيع البيانات
            image_data = image_data.astype(np.float32)
            image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min()) * 255
            image_data = image_data.astype(np.uint8)
            
            # نأخذ شريحة من المنتصف
            if len(image_data.shape) == 3:
                slice_idx = image_data.shape[2] // 2
                image_slice = image_data[:, :, slice_idx]
            elif len(image_data.shape) == 2:
                image_slice = image_data
            else:
                # إذا كانت 4D، نأخذ الشريحة الأولى من البعد الرابع
                slice_idx = image_data.shape[2] // 2
                image_slice = image_data[:, :, slice_idx, 0]
            
            img = Image.fromarray(image_slice)
            img.save(preview_path)
            return preview_filename
            
    except Exception as e:
        print(f"Error converting file: {e}")
        return None
    
    return None









medical_procedures = {
    "perfusion": ["body perfusion", "brain perfusion"],
    "CTA": ["body CTA", "Limbs CTA", "neuro CTA"],
    "joint": ["Ankle Helical", "Arm Helical", "Hip Helical", "Joint HR", "Knee Helical", "Leg Helical", "Wrist Helical"],
    "spine": ["spine axial", "Spine DT", "Spine Helical"],
    "pelvis": ["Pelvis Axial", "pelvis helical"],
    "abdomen": ["abdomen Axial", "abdomen helical", "CTU", "Multi-phase"],
    "chest": ["chest Helical", "chest HR", "chest Contrast"],
    "shoulder": ["shoulder helical", "shoulder HR"],
    "neck": ["C-Spine DT", "Neck Axial", "Neck Helical", "Neck Contrast"],
    "head": ["Head axial", "head helical", "dental helical", "inner ear helical", "inner ear HR", "sinus helical", "head contrast"]
}


def save_uploaded_file(file, post_id, user_id):
    if file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        return None
    
    # إنشاء اسم فريد للملف
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    original_filename = secure_filename(file.filename)
    extension = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{user_id}_{post_id}_{timestamp}.{extension}"
    
    # إنشاء مجلد التخزين
    upload_folder = os.path.join('static', 'uploads', 'medical_images')
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, unique_filename)
    
    # حفظ الملف
    file.save(file_path)
    
    # تحويل DICOM/NIFTI إلى PNG لعرضها
    preview_filename = None
    if extension in ['dcm', 'nii', 'gz']:
        preview_filename = convert_to_preview(file_path, extension, unique_filename)
    
    return {
        'filename': unique_filename,
        'original_filename': original_filename,
        'file_path': file_path,
        'file_type': ALLOWED_EXTENSIONS[extension],
        'file_size': os.path.getsize(file_path),
        'preview_filename': preview_filename
    }

# الصفحات الرئيسية
@app.route('/')
def index():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user.role == 'doctor':
            return redirect(url_for('doctor_dashboard'))
        else:
            return redirect(url_for('nurse_dashboard'))
    return redirect(url_for('login'))

# تسجيل المستخدم الجديد
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # جمع البيانات من النموذج
        username = request.form['username']
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        email = request.form['email']
        phone = request.form['phone']
        gender = request.form['gender']
        role = request.form['role']
        password = request.form['password']
        
        # التحقق من وجود المستخدم مسبقاً
        if User.query.filter_by(username=username).first():
            flash('اسم المستخدم موجود مسبقاً', 'error')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('البريد الإلكتروني موجود مسبقاً', 'error')
            return redirect(url_for('register'))
        
        # إنشاء مستخدم جديد
        new_user = User(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            gender=gender,
            role=role
        )
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.', 'success')
            return redirect(url_for('login'))
        except:
            db.session.rollback()
            flash('حدث خطأ أثناء إنشاء الحساب', 'error')
    
    return render_template('register.html')

# تسجيل الدخول
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['name'] = f"{user.first_name} {user.last_name}"
            
            if user.role == 'doctor':
                return redirect(url_for('doctor_dashboard'))
            else:
                return redirect(url_for('nurse_dashboard'))
        else:
            flash('اسم المستخدم أو كلمة المرور غير صحيحة', 'error')
    
    return render_template('login.html')

# تسجيل الخروج
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# لوحة تحكم الممرض
@app.route('/nurse/dashboard')
def nurse_dashboard():
    if 'user_id' not in session or session['role'] != 'nurse':
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    # الحصول على منشورات الممرض مرتبة من الأحدث
    posts = Post.query.filter_by(user_id=user.id).order_by(Post.created_at.desc()).all()
    
    return render_template('nurse_dashboard.html', user=user, posts=posts)

# لوحة تحكم الطبيب
@app.route('/doctor/dashboard')
def doctor_dashboard():
    if 'user_id' not in session or session['role'] != 'doctor':
        return redirect(url_for('login'))
    
    # الحصول على جميع منشورات الممرضين
    posts = Post.query.order_by(Post.created_at.desc()).all()


 
    
    return render_template('doctor_dashboard.html', posts=posts)

# إنشاء منشور جديد مع الصور
@app.route('/create_post', methods=['POST'])
def create_post():
    if 'user_id' not in session or session['role'] != 'nurse':
        return jsonify({'success': False, 'error': 'غير مصرح'})
    
    try:
        # إنشاء المنشور
        title = request.form['title']
        content = request.form['content']
        category = request.form['category']
        urgency = request.form.get('urgency', 'normal')
        
        new_post = Post(
            title=title,
            content=content,
            category=category,
            urgency=urgency,
            user_id=session['user_id']
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        # رفع الصور إذا وجدت
        uploaded_images = []
        if 'medical_images[]' in request.files:
            files = request.files.getlist('medical_images[]')
            
            for file in files:
                if file and file.filename != '' and allowed_file(file.filename):
                    saved_file = save_uploaded_file(file, new_post.id, session['user_id'])
                    
                    if saved_file:
                        medical_image = MedicalImage(
                            filename=saved_file['filename'],
                            original_filename=saved_file['original_filename'],
                            file_type=saved_file['file_type'],
                            file_size=saved_file['file_size'],
                            preview_filename=saved_file['preview_filename'],
                            post_id=new_post.id,
                            user_id=session['user_id']
                        )
                        
                        db.session.add(medical_image)
                        uploaded_images.append(saved_file['original_filename'])
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'post_id': new_post.id,
            'message': f'تم نشر الاستفسار بنجاح{" مع " + str(len(uploaded_images)) + " صور" if uploaded_images else ""}'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# الحصول على تفاصيل منشور
@app.route('/post/<int:post_id>')
def get_post(post_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    post = Post.query.get_or_404(post_id)
    medical_categories = list(medical_procedures.keys())
    return render_template('post_detail.html', post=post,medical_procedures=medical_procedures,
                         medical_categories=medical_categories)

# إضافة رد من الطبيب
@app.route('/add_reply', methods=['POST'])
def add_reply():
    if 'user_id' not in session or session['role'] != 'doctor':
        return jsonify({'success': False, 'error': 'غير مصرح'})
    
    post_id = request.form['post_id']
    content = request.form['content']
    diagnosis = request.form.get('diagnosis', '')
    treatment = request.form.get('treatment', '')
    recommendations = request.form.get('recommendations', '')
    proto=request.form.get('protocol', '')
    cont=request.form.get('examination', '')
    
    new_reply = Reply(
        content=content,
        diagnosis=diagnosis,
        treatment=treatment,
        recommendations=recommendations,
        post_id=post_id,
        medical_proces=proto,
        medical_cate=cont,
        doctor_id=session['user_id']
    )
    
    try:
        db.session.add(new_reply)
        db.session.commit()
        return jsonify({'success': True, 'reply_id': new_reply.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# API للحصول على الردود الخاصة بمنشور
@app.route('/api/post/<int:post_id>/replies')
def get_post_replies(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'غير مصرح'})
    
    post = Post.query.get_or_404(post_id)
    replies = []
    
    for reply in post.replies:
        doctor = User.query.get(reply.doctor_id)
        replies.append({
            'id': reply.id,
            'content': reply.content,
            'diagnosis': reply.diagnosis,
            'treatment': reply.treatment,
            'recommendations': reply.recommendations,
            'medical_proces':reply.medical_proces,
            'medical_cate':reply.medical_cate,
            'created_at': reply.created_at.strftime('%Y-%m-%d %H:%M'),
            'doctor_name': f"{doctor.first_name} {doctor.last_name}"
        })
    
    return jsonify(replies)

# API للحصول على الصور الخاصة بمنشور
@app.route('/api/post/<int:post_id>/images')
def get_post_images(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'غير مصرح'}), 401
    
    post = Post.query.get_or_404(post_id)
    images = [img.to_dict() for img in post.medical_images]
    
    return jsonify(images)

# رفع صور إضافية لمنشور موجود
@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'user_id' not in session or session.get('role') != 'nurse':
        return jsonify({'success': False, 'error': 'غير مصرح'})
    
    if 'post_id' not in request.form:
        return jsonify({'success': False, 'error': 'رقم المنشور مطلوب'})
    
    if 'medical_image' not in request.files:
        return jsonify({'success': False, 'error': 'لم يتم اختيار صورة'})
    
    file = request.files['medical_image']
    post_id = request.form['post_id']
    
    if file and file.filename != '' and allowed_file(file.filename):
        saved_file = save_uploaded_file(file, post_id, session['user_id'])
        
        if saved_file:
            medical_image = MedicalImage(
                filename=saved_file['filename'],
                original_filename=saved_file['original_filename'],
                file_type=saved_file['file_type'],
                file_size=saved_file['file_size'],
                preview_filename=saved_file['preview_filename'],
                post_id=post_id,
                user_id=session['user_id']
            )
            
            db.session.add(medical_image)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'image_id': medical_image.id,
                'filename': medical_image.original_filename,
                'url': f"/static/uploads/medical_images/{saved_file['filename']}",
                'preview_url': f"/static/uploads/medical_images/{saved_file['preview_filename']}" if saved_file['preview_filename'] else None
            })
    
    return jsonify({'success': False, 'error': 'فشل في رفع الملف'})

# عرض صورة طبية
@app.route('/view_medical_image/<int:image_id>')
def view_medical_image(image_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    medical_image = MedicalImage.query.get_or_404(image_id)
    
    # التحقق من صلاحية المشاهدة
    if session.get('role') not in ['doctor', 'nurse']:
        flash('غير مصرح لك بمشاهدة الصورة', 'error')
        return redirect(url_for('get_post', post_id=medical_image.post_id))
    
    return render_template('view_image.html', image=medical_image)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000,debug=True)

