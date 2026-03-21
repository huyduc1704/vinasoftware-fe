'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Checkbox, message, Typography, Space, Divider, Row, Col, Alert, Tooltip, App } from 'antd';
import {
    SaveOutlined, ReloadOutlined, EyeOutlined,
    BoldOutlined, ItalicOutlined, UnderlineOutlined,
    StrikethroughOutlined, AlignLeftOutlined, AlignCenterOutlined,
    AlignRightOutlined, OrderedListOutlined, UnorderedListOutlined,
    LinkOutlined
} from '@ant-design/icons';
import { systemSettingsApi } from '@/utils/api';

import QuillEditor from '@/components/common/QuillEditor';

const { Title, Text } = Typography;

export default function FooterManagerPage() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [footerTitle, setFooterTitle] = useState('');
    const [footerContent, setFooterContent] = useState('');
    const [isShowing, setIsShowing] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setFetching(true);
        try {
            const data = await systemSettingsApi.getSettings();
            setFooterTitle(data.FOOTER_TITLE_VI || '');
            setIsShowing(data.FOOTER_SHOW === 'true');
            setFooterContent(data.FOOTER_CONTENT_VI || '');
        } catch (error) {
            console.error('Lỗi load data:', error);
            message.error('Không thể tải dữ liệu');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const settings = [
                { key: 'FOOTER_TITLE_VI', value: footerTitle, description: 'Tiêu đề Footer VI' },
                { key: 'FOOTER_CONTENT_VI', value: footerContent, description: 'Nội dung Footer VI' },
                { key: 'FOOTER_SHOW', value: isShowing.toString(), description: 'Trạng thái hiển thị Footer' }
            ];
            await systemSettingsApi.updateTextSettings(settings);
            message.success('Cập nhật Footer thành công!');
        } catch (error: any) {
            message.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý Footer</Title>
                    <Text type="secondary">Cấu hình thông tin chân trang và bản quyền</Text>
                </div>
                <Space>
                    <Button style={{ height: '40px' }} icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                    <Button
                        type="primary"
                        danger
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={loading}
                        style={{ height: '40px', background: '#d32f2f' }}
                    >
                        Lưu cấu hình
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={15}>
                    <Card variant="borderless" className="shadow-sm" loading={fetching}>
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <Checkbox checked={isShowing} onChange={(e) => setIsShowing(e.target.checked)}>
                                Hiển thị Footer trên Website công ty
                            </Checkbox>

                            <div>
                                <Text strong>Tiêu đề Footer (VI)</Text>
                                <Input
                                    placeholder="Tiêu đề chính..."
                                    value={footerTitle}
                                    onChange={e => setFooterTitle(e.target.value)}
                                    style={{ marginTop: 8, padding: '10px' }}
                                />
                            </div>

                            <div>
                                <Text strong>Nội dung chi tiết</Text>
                                <div style={{ marginTop: 8, borderRadius: '8px', overflow: 'hidden' }}>
                                    <QuillEditor
                                        value={footerContent}
                                        onChange={setFooterContent}
                                        placeholder="Nhập nội dung Footer tại đây..."
                                    />
                                </div>
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={9}>
                    <Card
                        title={<Space><EyeOutlined /> Xem trước</Space>}
                        variant="borderless"
                        className="shadow-sm"
                        style={{ position: 'sticky', top: '24px' }}
                    >
                        <div style={{ padding: '20px', background: '#262626', color: '#fff', borderRadius: '12px' }}>
                            <Title level={5} style={{ color: '#fff', fontSize: '15px', marginBottom: '12px', borderLeft: '3px solid #d32f2f', paddingLeft: '12px' }}>
                                {footerTitle || 'VINA SOFTWARE'}
                            </Title>
                            <div
                                style={{ fontSize: '13px', color: '#bfbfbf', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{ __html: footerContent }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
