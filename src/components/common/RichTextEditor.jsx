import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, style }) => {
    const editorRef = useRef(null);
    const quillInstanceRef = useRef(null);
    const isLocalChange = useRef(false);

    useEffect(() => {
        if (!editorRef.current) return;

        const quill = new Quill(editorRef.current, {
            theme: 'snow',
            placeholder: placeholder || 'Write something...',
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ color: [] }, { background: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'clean']
                ]
            }
        });

        quillInstanceRef.current = quill;

        if (value) {
            // Use dangerously paste HTML safely
            quill.clipboard.dangerouslyPasteHTML(value);
        }

        quill.on('text-change', () => {
            isLocalChange.current = true;
            // Get HTML, but if it's empty, send empty string
            const html = quill.root.innerHTML;
            onChange(html === '<p><br></p>' ? '' : html);
        });

        return () => {
            const toolbar = editorRef.current?.previousSibling;
            if (toolbar && toolbar.className?.includes('ql-toolbar')) {
                toolbar.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (quillInstanceRef.current && !isLocalChange.current) {
            const html = quillInstanceRef.current.root.innerHTML;
            if (value !== html) {
                if (!value) {
                    quillInstanceRef.current.setText('');
                } else {
                    quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value);
                }
            }
        }
        isLocalChange.current = false;
    }, [value]);

    return (
        <div style={style}>
            <div ref={editorRef} style={{ background: 'var(--bg-panel)', color: 'var(--text-primary)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}></div>
        </div>
    );
};

export default RichTextEditor;
