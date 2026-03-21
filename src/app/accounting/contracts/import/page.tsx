'use client';

import React, { useState } from 'react';
import { Upload, Button, Typography, Space, message as antdMessage, Modal, Row, Col, App } from 'antd';
import { InboxOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import { contractApi } from '@/utils/api';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './grid-style.css';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function ImportContractsPage() {
    const { message, modal } = App.useApp();
    const [fileList, setFileList] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const isHeaderRow = (row: any[]) => {
        if (!row || !Array.isArray(row)) return false;
        const values = row.map(c => (c || "").toString().toLowerCase().trim());
        // Keywords with partial matching to be diacritic-resilient
        const keywords = ["stt", "phiếu", "msnv", "tên", "hợp đồng", "phòng", "khu vực", "ngày nộp", "thiết kế"];
        const matchCount = values.filter(v =>
            keywords.some(k => v.includes(k))
        ).length;
        return matchCount >= 2;
    };

    // Xử lý đọc file Excel ở Frontend
    const handlePreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

                if (rawRows.length > 0) {
                    // Tự động phát hiện số lượng dòng tiêu đề (có thể là 1, 2 hoặc 3 dòng...)
                    let headerRowsCount = 1;
                    for (let i = 1; i < Math.min(rawRows.length, 5); i++) {
                        if (isHeaderRow(rawRows[i])) {
                            headerRowsCount = i + 1;
                        } else {
                            // Nếu thấy dòng có STT là số, chắc chắn là bắt đầu dữ liệu
                            const firstVal = rawRows[i][0]?.toString().trim().toLowerCase();
                            if (firstVal && !isNaN(Number(firstVal))) break;
                        }
                    }

                    const topRow = rawRows[0] || [];
                    const subRow = headerRowsCount > 1 ? rawRows[headerRowsCount - 1] : [];

                    // Lấy số cột tối đa từ toàn bộ sheet để không bị rớt dữ liệu
                    let maxCols = 0;
                    rawRows.forEach((row: any[]) => {
                        if (row.length > maxCols) maxCols = row.length;
                    });

                    const merges = sheet['!merges'] || [];
                    const tableCols: any[] = [];
                    let lastProcessedMerge: any = null;

                    for (let col = 0; col < maxCols; col++) {
                        // Tìm merge ngang ở dòng đầu tiên (Header Group) - áp dụng cho Row 0
                        const hMerge = merges.find((m: any) => m.s.r === 0 && col >= m.s.c && col <= m.e.c && m.s.c !== m.e.c);

                        if (hMerge && headerRowsCount >= 2) {
                            if (lastProcessedMerge !== hMerge) {
                                const groupTitle = topRow[hMerge.s.c]?.toString().trim() || "";
                                const children = [];
                                for (let c = hMerge.s.c; c <= hMerge.e.c; c++) {
                                    // subRow (dòng header cuối cùng) chứa nhãn của con
                                    const subVal = subRow[c]?.toString().trim() || "";
                                    children.push({
                                        headerName: subVal || " ",
                                        field: `col_${c}`,
                                        width: 150,
                                        suppressSizeToFit: true
                                    });
                                }
                                tableCols.push({ headerName: groupTitle, children });
                                lastProcessedMerge = hMerge;
                            }
                        } else {
                            // Cột đơn hoặc cột gộp dọc
                            const tVal = topRow[col]?.toString().trim() || "";
                            const sVal = subRow && subRow[col] ? subRow[col].toString().trim() : "";
                            const title = tVal || sVal || `Cột ${col + 1}`;
                            tableCols.push({
                                headerName: title,
                                field: `col_${col}`,
                                width: 150,
                                pinned: col < 2 ? 'left' : undefined,
                            });
                        }
                    }

                    // Tách dữ liệu thực tế: bỏ qua tất cả các dòng header (kể cả lặp lại) 
                    const dataRows: { row: any[], realIdx: number }[] = [];
                    for (let i = headerRowsCount; i < rawRows.length; i++) {
                        const row = rawRows[i];
                        // Bỏ qua dòng trống
                        if (!row || row.every((c: any) => !c || c.toString().trim() === "")) continue;
                        // Bỏ qua dòng lặp tiêu đề
                        if (isHeaderRow(row)) continue;

                        dataRows.push({ row, realIdx: i });
                    }

                    const formattedData = dataRows.map(({ row: rowArr, realIdx: originalRowIndex }, rowIndex) => {
                        const rowObj: any = { key: rowIndex };
                        for (let col = 0; col < maxCols; col++) {
                            // Find if this cell (originalRowIndex, col) is within any merge
                            const merge = merges.find((m: any) =>
                                originalRowIndex >= m.s.r && originalRowIndex <= m.e.r &&
                                col >= m.s.c && col <= m.e.c
                            );

                            let value = "";
                            if (merge) {
                                // Take value from the top-left cell of the merge region (Flattening/Fill-down)
                                value = rawRows[merge.s.r] ? rawRows[merge.s.r][merge.s.c] : "";
                            } else {
                                value = rowArr[col] || "";
                            }
                            // Clean data: Always trim string values
                            rowObj[`col_${col}`] = value.toString().trim();
                        }
                        return rowObj;
                    });

                    setColumns(tableCols);
                    setPreviewData(formattedData);
                    message.success('Đọc file thành công, vui lòng kiểm tra dữ liệu trước khi Import!');
                } else {
                    message.warning('File Excel không có dữ liệu!');
                    setPreviewData([]);
                    setColumns([]);
                }
            } catch (error) {
                console.error('Error parsing excel', error);
                message.error('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng!');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        fileList: fileList,
        beforeUpload: (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                antdMessage.error('Chỉ được phép upload file Excel (.xls, .xlsx)!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            handlePreview(file as unknown as File);
            return false;
        },
        onRemove: () => {
            setFileList([]);
            setPreviewData([]);
            setColumns([]);
        },
        accept: ".xlsx, .xls"
    };

    const handleImport = async () => {
        if (fileList.length === 0) {
            message.warning('Vui lòng tải lên file Excel trước khi Import!');
            return;
        }

        const file = fileList[0] as File;
        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await contractApi.importContracts(formData);
            modal.info({
                title: 'Kết quả Import Hợp đồng',
                width: 600,
                content: (
                    <div style={{ marginTop: '16px' }}>
                        <p><strong>Thông báo:</strong> {res.message}</p>
                        <p><strong>Tổng số dòng:</strong> <Text strong style={{ color: '#1677ff' }}>{res.totalGroups}</Text></p>
                        <p><strong>Thành công:</strong> <Text strong style={{ color: '#52c41a' }}>{res.success}</Text></p>
                        <p><strong>Thất bại:</strong> <Text strong style={{ color: '#ff4d4f' }}>{res.failed}</Text></p>

                        {res.errors && res.errors.length > 0 && (
                            <div style={{ marginTop: '16px', background: '#fff1f0', padding: '12px', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                                <Text strong style={{ color: '#cf1322' }}>Danh sách lỗi:</Text>
                                <ul style={{ marginTop: '8px', color: '#cf1322', paddingLeft: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {res.errors.map((err: any, idx: number) => (
                                        <li key={idx} style={{ marginBottom: '8px' }}>
                                            <strong>Dòng {err.row}</strong> (HĐ: {err.contractCode}): {err.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ),
                onOk() {
                    setFileList([]);
                    setPreviewData([]);
                    setColumns([]);
                }
            });
        } catch (error: any) {
            console.error('Import failed', error);
            message.error(error.message || 'Có lỗi xảy ra khi gọi API Import');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 100px)' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>
                            <FileExcelOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                            Import Dữ liệu Hợp đồng
                        </Title>
                        <Text type="secondary">Tải lên file Excel (.xlsx) để xem trước và thực hiện import đồng loạt.</Text>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleImport}
                                loading={loading}
                                disabled={fileList.length === 0}
                                icon={<UploadOutlined />}
                                style={{ background: '#fce254', color: '#000', borderColor: '#fce254', fontWeight: 'bold' }}
                            >
                                THỰC HIỆN IMPORT
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Dragger {...uploadProps} style={{ padding: '40px 0', background: '#fafafa' }}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#1677ff' }} />
                    </p>
                    <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào khu vực này để tải lên</p>
                    <p className="ant-upload-hint">
                        Chỉ hỗ trợ file .xlsx hoặc .xls. Vui lòng sử dụng đúng template chuẩn để quá trình import diễn ra thuận lợi.
                    </p>
                </Dragger>
            </div>

            {previewData.length > 0 && (
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
                    <Title level={5} style={{ marginBottom: '16px' }}>Trích xuất Dữ liệu Kế toán</Title>
                    <div className="ag-theme-quartz"
                        data-lenis-prevent="true"
                        style={{ height: 600, width: '100%', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                        <AgGridReact
                            theme="legacy"
                            rowData={previewData}
                            columnDefs={columns}
                            defaultColDef={{
                                sortable: true,
                                filter: true,
                                resizable: true,
                            }}
                            pagination={true}
                            paginationPageSize={50}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
