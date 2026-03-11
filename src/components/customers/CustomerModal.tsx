import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';

interface CustomerModalProps {
    open: boolean;
    title: string;
    initialValues?: any;
    onCancel: () => void;
    onOk: (values: any) => Promise<void>;
}

export default function CustomerModal({ open, title, initialValues, onCancel, onOk }: CustomerModalProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    ...initialValues,
                    dob: initialValues.dob ? dayjs(initialValues.dob) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            // Format dates
            const formattedValues = {
                ...values,
                dob: values.dob ? values.dob.toISOString() : null,
            };

            await onOk(formattedValues);
            form.resetFields();
            onCancel();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={title}
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            onOk={handleOk}
            okText="Lưu lại"
            cancelText="Hủy"
            width={800}
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="fullName" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập Tên khách hàng!' }]}>
                            <Input placeholder="Nhập tên khách hàng" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="representative" label="Người đại diện">
                            <Input placeholder="Nhập người đại diện" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="taxCode" label="Mã số thuế">
                            <Input placeholder="Nhập mã số thuế" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập Số điện thoại!' }]}>
                            <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}>
                            <Input placeholder="Nhập email" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="dob" label="Ngày sinh">
                            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="address" label="Địa chỉ">
                            <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
