'use client';
import React, { useState, useEffect } from 'react';
import { Card, Upload, Typography, Divider, Image, Button, Popconfirm, App } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { cloudinaryApi, systemSettingsApi } from '@/utils/api';
import { useSettings } from '@/components/provideres/SettingProvider';

const { Dragger } = Upload;
const { Title, Text } = Typography;
export default function FaviconUploadPage() {
    const { message } = App.useApp();
    const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { faviconUrl, faviconPublicId, refreshSettings } = useSettings();

    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        try {
            const data = await systemSettingsApi.getSettings();
            if (data.WEBSITE_FAVICON_URL) {
                setCurrentFavicon(data.WEBSITE_FAVICON_URL);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };
    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        setLoading(true);
        try {
            const response = await systemSettingsApi.uploadFavicon(file as File);
            message.success('Cập nhật favicon thành công!');
            if (response.WEBSITE_FAVICON_URL) {
                setCurrentFavicon(response.WEBSITE_FAVICON_URL);
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
        if (!faviconPublicId) {
            message.warning('Không tìm thấy thông tin ảnh cần xóa!');
            return;
        }
        setLoading(true);
        try {
            await cloudinaryApi.deleteImage(faviconPublicId);
            await systemSettingsApi.deleteFavicon();

            message.success('Đã xóa favicon thành công!');
            await refreshSettings();
        } catch (error: any) {
            message.error(`Xóa thất bại: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Card variant='borderless' className="shadow-sm">
                <Title level={3}>Cấu hình Favicon</Title>
                <Text type="secondary">
                    Tải lên biểu tượng cho website. Ảnh sẽ tự động được cắt vuông 48x48 pixel.
                </Text>

                <Divider />
                <div style={{ marginBottom: '32px' }}>
                    <Title level={5}>Favicon hiện tại</Title>
                    <div style={{
                        padding: '20px',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minHeight: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #d9d9d9',
                        gap: '16px' // Khoảng cách giữa ảnh và nút
                    }}>
                        {faviconUrl ? (
                            <>
                                <Image
                                    src={faviconUrl}
                                    width={200}
                                    height={100}
                                    alt="Favicon"
                                    style={{ objectFit: 'contain' }}
                                    preview={false}
                                />

                                <Popconfirm
                                    title="Xóa Favicon"
                                    description="Bạn có chắc chắn muốn xóa favicon này không?"
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
                                        Xóa ảnh Favicon
                                    </Button>
                                </Popconfirm>
                            </>
                        ) : (
                            <Text type="secondary">Chưa có Favicon</Text>
                        )}
                    </div>
                </div>

                <Title level={5}>Tải lên Favicon mới</Title>
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
                        Hệ thống sẽ tự động lấy phần trung tâm của ảnh để làm favicon vuông.
                    </p>
                </Dragger>
            </Card>
        </div>
    );
}