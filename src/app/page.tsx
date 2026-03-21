'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Space, Progress, Spin, message } from 'antd';
import { UserOutlined, FileTextOutlined, FileDoneOutlined, EnvironmentOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';
import gsap from 'gsap';
import { dashboardApi } from '@/utils/api';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, employeesData, chart] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getFeaturedEmployees(),
        dashboardApi.getRevenueChart()
      ]);
      setStats(statsData);
      setEmployees(employeesData);
      setChartData(chart);
    } catch (error: any) {
      message.error(error.message || 'Lỗi tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 100,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => <strong style={{ color: '#1890ff' }}>{text}</strong>,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'role',
      key: 'role',
      render: (role: any) => role?.name || '-',
    },
    {
      title: 'Ngày gia nhập',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Bảng điều khiển</Title>
        <Text type="secondary">Tổng quan về tình hình hoạt động của công ty</Text>
      </div>

      {/* General Stats row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Statistic
              title="Tổng số nhân viên"
              value={stats?.totalEmployees?.value || 0}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#cf1322', fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="secondary">{stats?.totalEmployees?.growth}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Statistic
              title="Tổng số Khu vực"
              value={stats?.totalRegions?.value || 0}
              prefix={<EnvironmentOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="secondary">Đang hoạt động</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Statistic
              title="Khách hàng"
              value={stats?.newClients?.value || 0}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
              styles={{ content: { fontWeight: 600 } }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              <Text type="success">{stats?.newClients?.growth}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Contracts Stats Section */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '36px', marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0, color: '#262626' }}>Tình trạng Hợp đồng</Title>
        <div style={{ flex: 1, height: '1px', background: '#f0f0f0', marginLeft: '16px' }} />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '15px' }}>Hợp đồng Đang thực hiện</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '16px' }}>
              <FileDoneOutlined style={{ fontSize: '32px', color: '#1890ff', marginRight: '16px' }} />
              <span style={{ fontSize: '36px', fontWeight: 600, lineHeight: 1 }}>{stats?.activeContracts?.value || 0}</span>
            </div>
            <Text style={{ color: '#1890ff', fontSize: '14px', fontWeight: 500 }}>Đang thực hiện</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '15px' }}>Hợp đồng Đang chờ xử lý</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '16px' }}>
              <SyncOutlined style={{ fontSize: '32px', color: '#faad14', marginRight: '16px' }} />
              <span style={{ fontSize: '36px', fontWeight: 600, lineHeight: 1 }}>{stats?.pendingContracts?.value || 0}</span>
            </div>
            <Text style={{ color: '#faad14', fontSize: '14px', fontWeight: 500 }}>Chờ xử lý</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%', borderRadius: '12px' }}>
            <Text type="secondary" style={{ fontSize: '15px' }}>Hợp đồng Đã hoàn thành</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '16px' }}>
              <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginRight: '16px' }} />
              <span style={{ fontSize: '36px', fontWeight: 600, lineHeight: 1 }}>{stats?.completedContracts?.value || 0}</span>
            </div>
            <Text style={{ color: '#52c41a', fontSize: '14px', fontWeight: 500 }}>Đã hoàn thành</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Content Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title="Nhân viên nổi bật"
            variant="borderless"
            style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', height: '100%' }}
          >
            <Table
              columns={columns}
              dataSource={employees}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Biểu đồ doanh thu 2026"
            variant="borderless"
            style={{ height: '100%', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <div style={{ height: 350, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(Number(value) / 1000000)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="doanhThu" name="Tổng Doanh Thu HĐ" fill="#1890ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="thucThu" name="Thực Thu" fill="#52c41a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

    </div>
  );
}
