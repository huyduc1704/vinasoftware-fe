import React, { useEffect } from 'react';
import { Modal, Form, Input, App } from 'antd';
import { Role } from '@/types/role';

interface RoleModalProps {
    open: boolean;
    role: Role | null;
    onCancel: () => void;
    onSuccess: () => void;
    loading: boolean;
    onSave: (data: any) => Promise<void>;
}

const RoleModal: React.FC<RoleModalProps> = ({
    open, role, onCancel, onSuccess, loading, onSave
}) => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    useEffect(() => {
        if (open) {
            if (role) {
                form.setFieldsValue({
                    name: role.name,
                    description: role.description,
                    code: role.code,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, role, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSave(values);
            message.success(`${role ? 'Cập nhật' : 'Tạo'} nhóm quyền thành công`);
            onSuccess();
        } catch (error) {
            message.error(`${role ? 'Cập nhật' : 'Tạo'} nhóm quyền thất bại`);
        }
    }

    return (
        <Modal
            title={role ? 'Chỉnh sửa nhóm quyền' : 'Tạo nhóm quyền mới'}
            open={open}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            destroyOnHidden
            styles={{ body: { padding: 0 } }}
        >
            <div data-lenis-prevent="true" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="code"
                        label="Mã nhóm quyền"
                        rules={[{ required: true, message: 'Vui lòng nhập mã nhóm quyền' }]}
                    >
                        <Input placeholder='Ví dụ: ADMIN, MANAGER' disabled={!!role} />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên nhóm quyền"
                        rules={[{ required: true, message: 'Vui lòng nhập tên nhóm quyền' }]}
                    >
                        <Input placeholder='Ví dụ: Quản trị viên' />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea placeholder='Nhập mô tả cho nhóm quyền này' />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default RoleModal;