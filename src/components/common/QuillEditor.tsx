'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface QuillEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'clean']
    ]
};

export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
    return (
        <div style={{ background: '#fff' }}>
            <style>{`
            .ql-container.ql-snow {
                min-height: 200px;
                font-size: 14px;
                font-family: inherit;
            }
        `}</style>
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder || 'Nhập nội dung...'}
            />
        </div>
    );
}