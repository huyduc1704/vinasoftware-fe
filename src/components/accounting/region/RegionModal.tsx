import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, message } from 'antd';

interface RegionModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (values: any) => Promise<void>;
    initialValues?: any;
    title: string;
}

export default function RegionModal({ open, onCancel, onOk, initialValues, title }: RegionModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    ...initialValues,
                    isActive: initialValues.isActive ?? true,
                });
            } else {
                form.resetFields();
                form.setFieldValue('isActive', true);
            }
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await onOk(values);
            form.resetFields();
            onCancel();
        } catch (error: any) {
            console.error('Validation failed:', error);
            if (error.message) message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={title}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            width={600}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="code"
                    label="Mã khu vực"
                    rules={[{ required: true, message: 'Vui lòng nhập Mã khu vực!' }]}
                >
                    <Input placeholder="VD: HO" disabled={!!initialValues} />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Tên khu vực"
                    rules={[{ required: true, message: 'Vui lòng nhập Tên khu vực!' }]}
                >
                    <Input placeholder="VD: Head Office" />
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ">
                    <Input.TextArea rows={3} placeholder="Nhập địa chỉ khu vực (nếu có)" />
                </Form.Item>

                <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm khóa" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
