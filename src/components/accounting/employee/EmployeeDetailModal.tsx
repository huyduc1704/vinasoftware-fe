import React from 'react';
import { Modal, Descriptions, Image, Typography, Row, Col, Divider, Tag, Space } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface EmployeeDetailModalProps {
    visible: boolean;
    employee: any;
    onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ visible, employee, onClose }) => {
    if (!employee) return null;

    const files = employee.files || [];
    const avatar = files.find((f: any) => f.category === 'AVATAR');
    const idFront = files.find((f: any) => f.category === 'ID_FRONT');
    const idBack = files.find((f: any) => f.category === 'ID_BACK');

    const avatarUrl = avatar ? avatar.filePath : `https://api.dicebear.com/7.x/miniavs/svg?seed=${employee.employeeCode}`;

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0 }}>Chi tiết nhân sự</Title>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={850}
            centered
        >
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[24, 24]} style={{ marginTop: '16px' }}>
                <Col span={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Image
                        width={180}
                        height={240}
                        src={avatarUrl}
                        alt={employee.fullName}
                        style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                    />
                    <Tag color="blue" style={{ marginTop: '16px', fontSize: '14px', padding: '4px 12px' }}>
                        {employee.role?.name || employee.roleCode || 'Nhân viên'}
                    </Tag>
                </Col>

                <Col span={16}>
                    <Descriptions column={1} labelStyle={{ fontWeight: 600, width: '130px' }} bordered size="small">
                        <Descriptions.Item label="Mã nhân viên">
                            <Text strong type="danger">{employee.employeeCode}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Họ và tên">
                            {employee.fullName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            {employee.phone || employee.phoneNumber || 'Đang cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            <a href={`mailto:${employee.email}`}>{employee.email || 'Đang cập nhật'}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">
                            {employee.address || 'Đang cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {employee.dob ? dayjs(employee.dob).format('DD/MM/YYYY') : 'Đang cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày gia nhập">
                            {employee.joinDate ? dayjs(employee.joinDate).format('DD/MM/YYYY') : 'Đang cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {employee.isActive ? (
                                <Tag color="success">Đang làm việc</Tag>
                            ) : (
                                <Tag color="default">Tạm khóa</Tag>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>

            <Divider style={{ margin: '24px 0 16px' }}>
                <Text strong>Ảnh CCCD / CMND</Text>
            </Divider>

            <Row gutter={[16, 16]} justify="center">
                <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Mặt trước</div>
                    {idFront ? (
                        <Image
                            width={300}
                            height={190}
                            src={idFront.filePath}
                            style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #d9d9d9', background: '#f5f5f5' }}
                        />
                    ) : (
                        <div style={{ width: 300, height: 190, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#bfbfbf' }}>
                            Chưa cập nhật
                        </div>
                    )}
                </Col>
                <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Mặt sau</div>
                    {idBack ? (
                        <Image
                            width={300}
                            height={190}
                            src={idBack.filePath}
                            style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #d9d9d9', background: '#f5f5f5' }}
                        />
                    ) : (
                        <div style={{ width: 300, height: 190, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#bfbfbf' }}>
                            Chưa cập nhật
                        </div>
                    )}
                </Col>
            </Row>
        </Modal>
    );
};

export default EmployeeDetailModal;