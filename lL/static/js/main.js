// دالة لتهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تفعيل أدوات التحقق من النماذج
    initFormValidation();
    
    // تفعيل التأثيرات البصرية
    initVisualEffects();
    
    // تفعيل معالجة الأخطاء
    initErrorHandling();
    
    // تفعيل خاصية رفع الملفات
    initFileUpload();
    
    // تفعيل أزرار عرض الصور
    initImageGalleryButtons();
});

// التحقق من صحة النماذج
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    highlightError(field);
                } else {
                    removeErrorHighlight(field);
                }
            });
            
            // التحقق من صحة البريد الإلكتروني
            const emailFields = this.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value && !isValidEmail(field.value)) {
                    isValid = false;
                    highlightError(field, 'البريد الإلكتروني غير صالح');
                }
            });
            
            // التحقق من صحة رقم الهاتف
            const phoneFields = this.querySelectorAll('input[type="tel"]');
            phoneFields.forEach(field => {
                if (field.value && !isValidPhone(field.value)) {
                    isValid = false;
                    highlightError(field, 'رقم الهاتف غير صالح');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showToast('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
            }
        });
    });
}

// التأكيد على الحذف
function confirmDelete(message = 'هل أنت متأكد من حذف هذا العنصر؟') {
    return confirm(message);
}

// إظهار رسالة toast
function showToast(message, type = 'info') {
    // إنشاء عنصر toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideDown 0.3s ease;
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
        font-family: 'Cairo', sans-serif;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // إزالة toast بعد 5 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// إضافة أنماط animation للـ toast
if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, -100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// التأثيرات البصرية
function initVisualEffects() {
    // إضافة تأثير hover على البطاقات
    const cards = document.querySelectorAll('.dashboard-card, .post-item, .reply-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
    
    // تأثيرات على الأزرار
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // تحميل الصور بشكل متدرج
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        observer.observe(img);
    });
}

// معالجة الأخطاء
function initErrorHandling() {
    // اعتراض أخطاء الشبكة
    window.addEventListener('online', () => {
        showToast('تم استعادة الاتصال بالإنترنت', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('فقدان الاتصال بالإنترنت. يرجى التحقق من الشبكة.', 'error');
    });
    
    // معالجة أخطاء AJAX العامة
    window.addEventListener('unhandledrejection', function(event) {
        console.error('حدث خطأ غير متوقع:', event.reason);
        showToast('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', 'error');
    });
}

// دوال مساعدة
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[\+]?[0-9\s\-\(\)]+$/;
    return re.test(phone);
}

function highlightError(field, message = 'هذا الحقل مطلوب') {
    field.style.borderColor = '#e76f51';
    field.style.boxShadow = '0 0 0 3px rgba(231, 111, 81, 0.2)';
    
    // إضافة رسالة خطأ إذا لم تكن موجودة
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
        errorElement = document.createElement('small');
        errorElement.className = 'error-message';
        errorElement.style.cssText = 'color: #e76f51; display: block; margin-top: 5px; font-size: 0.85rem;';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function removeErrorHighlight(field) {
    field.style.borderColor = '';
    field.style.boxShadow = '';
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// دالة لتنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة لاختصار النص الطويل
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// دالة لتحديث الوقت الحقيقي (للردود)
function startRealtimeUpdates(updateCallback, interval = 30000) {
    setInterval(updateCallback, interval);
    return updateCallback;
}

// إضافة دوال لرفع الملفات
function initFileUpload() {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('medicalImages');
    const fileList = document.getElementById('fileList');
    
    if (!dropzone || !fileInput || !fileList) return;
    
    // عند النقر على منطقة الرفع
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // عند اختيار ملفات
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // دعم السحب والإفلات
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = 'rgba(42, 157, 143, 0.15)';
        dropzone.style.borderColor = '#21867a';
    });
    
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '';
        dropzone.style.borderColor = '';
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '';
        dropzone.style.borderColor = '';
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    function handleFiles(files) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['dcm', 'nii', 'gz', 'png', 'jpg', 'jpeg'];
        
        for (let file of files) {
            // التحقق من النوع
            const extension = file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(extension)) {
                showToast(`نوع الملف غير مدعوم: ${file.name}`, 'error');
                continue;
            }
            
            // التحقق من الحجم
            if (file.size > maxSize) {
                showToast(`الملف كبير جداً: ${file.name} (الحد الأقصى 50MB)`, 'error');
                continue;
            }
            
            // إضافة الملف للقائمة
            addFileToList(file);
        }
    }
    
    function addFileToList(file) {
        const fileId = 'file_' + Date.now() + Math.random().toString(36).substr(2, 9);
        const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;
        fileItem.dataset.file = file.name;
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-medical-alt file-icon"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="removeFile('${fileId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    }
}

// إزالة ملف من القائمة
function removeFile(fileId) {
    const fileItem = document.getElementById(fileId);
    if (fileItem) {
        fileItem.remove();
    }
}

// مسح قائمة الملفات
function clearFileList() {
    const fileList = document.getElementById('fileList');
    if (fileList) {
        fileList.innerHTML = '';
    }
    const fileInput = document.getElementById('medicalImages');
    if (fileInput) {
        fileInput.value = '';
    }
}

// رفع الملفات عند إرسال النموذج
async function uploadFilesWithPost(formData, postId = null) {
    const filesInput = document.getElementById('medicalImages');
    
    if (filesInput.files.length > 0) {
        // إضافة الملفات إلى FormData
        for (let i = 0; i < filesInput.files.length; i++) {
            formData.append('medical_images[]', filesInput.files[i]);
        }
    }
    
    if (postId) {
        formData.append('post_id', postId);
    }
    
    const url = postId ? '/upload_image' : '/create_post';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error uploading files:', error);
        return { success: false, error: 'خطأ في الاتصال بالخادم' };
    }
}

// تفعيل أزرار عرض الصور
function initImageGalleryButtons() {
    document.querySelectorAll('.view-images-btn').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.dataset.postId;
            openImageGallery(postId);
        });
    });
}

// عرض معرض الصور
function openImageGallery(postId) {
    showToast('جاري تحميل الصور...', 'info');
    
    fetch(`/api/post/${postId}/images`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في تحميل الصور');
            }
            return response.json();
        })
        .then(images => {
            if (images.length > 0) {
                // إنشاء نافذة عرض الصور
                showImageGalleryModal(images);
            } else {
                showToast('لا توجد صور لهذا المنشور', 'info');
            }
        })
        .catch(error => {
            console.error('Error loading images:', error);
            showToast('حدث خطأ في تحميل الصور', 'error');
        });
}

function showImageGalleryModal(images) {
    // إنشاء عنصر المعرض
    const galleryModal = document.createElement('div');
    galleryModal.className = 'gallery-modal';
    galleryModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        backdrop-filter: blur(5px);
    `;
    
    // إنشاء محتوى المعرض
    let imagesHTML = '';
    images.forEach((img, index) => {
        const imageUrl = img.preview_url || img.url;
        const isMedicalImage = img.file_type && ['DICOM', 'NIFTI', 'NIFTI_GZ'].includes(img.file_type);
        
        imagesHTML += `
            <div class="gallery-item" style="margin: 15px; text-align: center; position: relative;">
                <div style="position: relative; display: inline-block;">
                    <img src="${imageUrl}" 
                         alt="${img.original_filename}"
                         style="max-width: 280px; max-height: 220px; object-fit: contain; border-radius: 8px; cursor: pointer; border: 2px solid #2a9d8f;"
                         onclick="openImageInViewer(${img.id})">
                    ${isMedicalImage ? `
                        <div style="position: absolute; top: 10px; left: 10px; background: #2a9d8f; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold;">
                            ${img.file_type}
                        </div>
                    ` : ''}
                </div>
                <div style="color: white; margin-top: 10px; font-size: 0.85rem; max-width: 280px;">
                    <div style="font-weight: 500; margin-bottom: 5px;">${img.original_filename}</div>
                    <div style="color: #aaa; font-size: 0.75rem;">
                        ${(img.file_size / 1024 / 1024).toFixed(2)} MB • ${img.file_type || 'صورة'}
                    </div>
                </div>
            </div>
        `;
    });
    
    galleryModal.innerHTML = `
        <div style="width: 100%; max-width: 1400px; background: rgba(30, 30, 30, 0.95); border-radius: 15px; padding: 25px; max-height: 90vh; overflow-y: auto; border: 1px solid #444;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #2a9d8f;">
                <div>
                    <h3 style="color: white; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-images" style="color: #2a9d8f;"></i>
                        الصور الطبية (${images.length})
                    </h3>
                    <p style="color: #aaa; margin: 5px 0 0 0; font-size: 0.9rem;">
                        انقر على أي صورة لعرضها بحجم كامل
                    </p>
                </div>
                <button onclick="closeGalleryModal()" 
                        style="background: none; border: none; color: white; font-size: 1.8rem; cursor: pointer; padding: 5px 10px; border-radius: 5px; transition: background-color 0.3s;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 25px;">
                ${imagesHTML}
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #444;">
                <button onclick="closeGalleryModal()" 
                        style="background: #2a9d8f; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: background-color 0.3s;">
                    <i class="fas fa-times"></i> إغلاق المعرض
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(galleryModal);
    document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية
    
    // إغلاق بالنقر خارج المحتوى
    galleryModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeGalleryModal();
        }
    });
    
    // إضافة تأثير hover على الزر
    const closeBtn = galleryModal.querySelector('button[onclick="closeGalleryModal()"]');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#21867a';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#2a9d8f';
    });
    
    // إغلاق بالزر ESC
    const closeOnEsc = function(e) {
        if (e.key === 'Escape') {
            closeGalleryModal();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
}

// فتح الصورة في عارض منفصل
function openImageInViewer(imageId) {
    window.open(`/view_medical_image/${imageId}`, '_blank');
}

// إغلاق معرض الصور
function closeGalleryModal() {
    const galleryModal = document.querySelector('.gallery-modal');
    if (galleryModal) {
        galleryModal.remove();
        document.body.style.overflow = ''; // إعادة تفعيل التمرير
    }
}

// دالة لتحويل حجم الملف إلى صيغة مقروءة
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// دالة للتحقق من صحة ملفات الصور الطبية
function validateMedicalFile(file) {
    const allowedExtensions = ['dcm', 'nii', 'gz', 'png', 'jpg', 'jpeg'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `نوع الملف غير مدعوم: ${file.name}. الصيغ المدعومة: DICOM, NIFTI, PNG, JPG`
        };
    }
    
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `الملف كبير جداً: ${file.name}. الحد الأقصى: 50MB`
        };
    }
    
    return { valid: true };
}

// دالة لعرض معاينة سريعة للصورة
function showQuickPreview(imageUrl, filename) {
    const previewModal = document.createElement('div');
    previewModal.className = 'quick-preview-modal';
    previewModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    previewModal.innerHTML = `
        <div style="max-width: 90vw; max-height: 90vh; position: relative;">
            <img src="${imageUrl}" 
                 alt="${filename}"
                 style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 8px;">
            <div style="position: absolute; bottom: -40px; left: 0; right: 0; text-align: center; color: white;">
                ${filename}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: #e76f51; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // إغلاق بالنقر خارج المحتوى
    previewModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// دالة لعرض مؤشر التحميل
function showLoading(message = 'جاري التحميل...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'custom-loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.7);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
    `;
    
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 20px;"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

// دالة لإخفاء مؤشر التحميل
function hideLoading() {
    const loadingDiv = document.getElementById('custom-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// دالة لعرض نموذج تأكيد مخصص
function showConfirmDialog(message, onConfirm, onCancel = null) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    dialog.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h3 style="color: #264653; margin-top: 0; margin-bottom: 20px; text-align: center;">
                <i class="fas fa-question-circle" style="color: #2a9d8f; margin-left: 10px;"></i>
                تأكيد الإجراء
            </h3>
            <p style="color: #6c757d; font-size: 1.1rem; text-align: center; line-height: 1.6;">
                ${message}
            </p>
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 30px;">
                <button id="confirmBtn" 
                        style="background: #2a9d8f; color: white; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; min-width: 100px;">
                    <i class="fas fa-check"></i> نعم
                </button>
                <button id="cancelBtn"
                        style="background: #e76f51; color: white; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; min-width: 100px;">
                    <i class="fas fa-times"></i> لا
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // إضافة مستمعي الأحداث
    document.getElementById('confirmBtn').addEventListener('click', function() {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    
    document.getElementById('cancelBtn').addEventListener('click', function() {
        dialog.remove();
        if (onCancel) onCancel();
    });
    
    // إغلاق بالنقر خارج الصندوق
    dialog.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
            if (onCancel) onCancel();
        }
    });
}

// تصدير الدوال للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        isValidPhone,
        formatDate,
        truncateText,
        showToast,
        initFileUpload,
        uploadFilesWithPost,
        openImageGallery,
        showConfirmDialog
    };
}