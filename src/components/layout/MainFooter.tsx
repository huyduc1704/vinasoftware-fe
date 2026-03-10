'use client';

import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

export default function MainFooter() {
    return (
        <Footer
            style={{
                textAlign: 'left',
                background: '#ffffffff',
                color: '#030303ff',
                padding: '24px 50px',
                borderTop: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginTop: '12px',
                marginBottom: '12px',
            }}
        >
            Vina Software Web Design | Thiết kế website cung cấp Hosting & Domain - Digital Marketing
            <br />
            <p style={{ color: '#898989' }}>Tel: 028 220 040 | Hotline: 0938 166 234 - 0909 633 601 - 0902 670 499 | Email: vns@vinasoftware.com</p>
        </Footer>
    );
}
