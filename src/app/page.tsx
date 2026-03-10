'use client';

import React, { useEffect, useRef } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Space, Progress } from 'antd';
import { UserOutlined, FileTextOutlined, AreaChartOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import gsap from 'gsap';

const { Title, Text, Paragraph } = Typography;

const columns = [
  {
    title: 'Mã NV',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Họ tên',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <strong style={{ color: '#1890ff' }}>{text}</strong>,
  },
  {
    title: 'Phòng ban',
    dataIndex: 'department',
    key: 'department',
  },
  {
    title: 'Trạng thái',
    key: 'status',
    dataIndex: 'status',
    render: (status: string[]) => (
      <>
        {status.map((tag) => {
          let color = tag === 'Đang làm việc' ? 'green' : 'volcano';
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
];

const mockData = [
  {
    key: '1',
    id: 'NV001',
    name: 'Nguyễn Lê Trung Kiên',
    department: 'Kinh doanh',
    status: ['Đang làm việc'],
  },
  {
    key: '2',
    id: 'NV023',
    name: 'Nguyễn Văn Cường',
    department: 'Kỹ thuật',
    status: ['Đang làm việc'],
  },
  {
    key: '3',
    id: 'NV045',
    name: 'Trần Thị Mai',
    department: 'Kế toán',
    status: ['Nghỉ phép'],
  },
  {
    key: '4',
    id: 'NV067',
    name: 'Lê Hoàng Phong',
    department: 'Marketing',
    status: ['Đang làm việc'],
  },
];

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Bảng điều khiển</Title>
        <Text type="secondary">Tổng quan về tình hình hoạt động của công ty</Text>
      </div>

      {/* Stats row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <Statistic
              title="Tổng số nhân viên"
              value={128}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#cf1322', fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="success"><ArrowUpOutlined /> 4.5%</Text> <Text type="secondary">so với tháng trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <Statistic
              title="Hợp đồng mới"
              value={42}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="danger"><ArrowDownOutlined /> 1.2%</Text> <Text type="secondary">so với tháng trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <Statistic
              title="Doanh số (Tháng)"
              value={1520000000}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              styles={{ content: { fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="success"><ArrowUpOutlined /> 12.5%</Text> <Text type="secondary">so với tháng trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <Statistic
              title="Tỷ lệ chuyển đổi"
              value={68.5}
              suffix="%"
              prefix={<AreaChartOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { fontWeight: 600 } }}
            />
            <Progress percent={68.5} showInfo={false} size="small" strokeColor="#722ed1" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* Main Content Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title="Nhân viên nổi bật (Mock Data)"
            variant="borderless"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%' }}
          >
            <Table
              columns={columns}
              dataSource={mockData}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>

        </Col>
      </Row>

      {/* Taller space to test scrolling with Lenis */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card variant="borderless" style={{ minHeight: '300px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={4} type="secondary">Khu vực chứa biểu đồ doanh thu</Title>

            </div>
          </Card>
        </Col>
      </Row>

    </div>
  );
}
