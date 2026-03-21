'use client';

import React, { useState, useEffect, } from 'react';
import { Card, Upload, Typography, Divider, Button, Image, Space, Popconfirm, App } from 'antd';
import { InboxOutlined, CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { systemSettingsApi, cloudinaryApi } from '@/utils/api';
import { useSettings } from '@/components/provideres/SettingProvider';

const { Dragger } = Upload;
const { Title, Text } = Typography;
export default function LogoUploadPage() {
    const { message } = App.useApp();
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { logoUrl, logoPublicId, refreshSettings } = useSettings();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await systemSettingsApi.getSettings();
            if (data.WEBSITE_LOGO_URL) {
                setCurrentLogo(data.WEBSITE_LOGO_URL);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            message.error('Failed to fetch settings');
        }
    };

    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        setLoading(true);
        try {
            const response = await systemSettingsApi.uploadLogo(file as File);
            message.success('Cập nhật logo thành công!');
            // Cloudinary API might return the new URL directly
            if (response.WEBSITE_LOGO_URL) {
                setCurrentLogo(response.WEBSITE_LOGO_URL);
            } else {
                fetchSettings();
            }
            onSuccess("Ok");
        } catch (error: any) {
            message.error(`Upload thất bại: ${error.message}`);
            onError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!logoPublicId) {
            message.warning('Không tìm thấy thông tin ảnh cần xóa!');
            return;
        }
        setLoading(true);
        try {
            //Xóa ảnh trên Cloudinary
            await cloudinaryApi.deleteImage(logoPublicId);

            //Xóa trong Database
            await systemSettingsApi.deleteLogo();

            message.success('Đã xóa logo thành công');
            await refreshSettings();
        } catch (error: any) {
            message.error(`Xóa thất bại: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Card variant='borderless' className='shadow-sm'>
                <Title level={3}>Cấu hình Logo</Title>
                <Text type='secondary'>
                    Tải logo chính thức cho website. Ảnh sẽ tự động được thu phóng về kích thước 200x100.
                </Text>

                <Divider />
                <div style={{ marginBottom: '32px' }}>
                    <Title level={5}>Logo hiện tại</Title>
                    <div style={{
                        padding: '20px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minHeight: '180px', // Tăng nhẹ chiều cao để chứa nút
                        display: 'flex',
                        flexDirection: 'column', // Xếp theo chiều dọc
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #d9d9d9',
                        gap: '16px' // Khoảng cách giữa ảnh và nút
                    }}>
                        {logoUrl ? (
                            <>
                                <Image
                                    src={logoUrl}
                                    width={200}
                                    height={100}
                                    alt="Logo"
                                    style={{ objectFit: 'contain' }}
                                    preview={false}
                                />

                                <Popconfirm
                                    title="Xóa Logo"
                                    description="Bạn có chắc chắn muốn xóa logo này không?"
                                    onConfirm={handleDelete}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true, loading }}
                                >
                                    <Button
                                        type="primary"
                                        danger
                                        ghost
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        loading={loading}
                                    >
                                        Xóa ảnh logo
                                    </Button>
                                </Popconfirm>
                            </>
                        ) : (
                            <Text type="secondary">Chưa có Logo</Text>
                        )}
                    </div>
                </div>

                <Title level={5}>Tải lên Logo mới</Title>
                <Dragger
                    customRequest={handleUpload}
                    showUploadList={false}
                    disabled={loading}
                    accept="image/*"
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#f4d03f' }} />
                    </p>
                    <p className="ant-upload-text">Nhấp hoặc kéo thả file vào khu vực này để tải lên</p>
                    <p className="ant-upload-hint">
                        Hỗ trợ định dạng JPG, PNG, WebP. Hệ thống sẽ tự động căn chỉnh về 200x100.
                    </p>
                </Dragger>
            </Card>
        </div>
    );
}
