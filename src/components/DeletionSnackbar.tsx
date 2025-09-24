/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStores } from '../store';
import { getDrawTools } from '../Constant';
import { CloseIcon } from './Icons';

type TDeletionSnackbarProps = {
    className?: string;
};

const DeletionSnackbar = observer(({ className }: TDeletionSnackbarProps) => {
    const { drawTools } = useStores();
    const snackbarRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { showDeletionSnackbar: isVisible, deletedToolName, hideDeletionSnackbar: onDismiss } = drawTools;

    // Generate dynamic message based on deleted tool type
    const getDeletionMessage = useCallback(() => {
        if (!deletedToolName) {
            return;
        }

        const drawToolsConfig = getDrawTools();
        // Find tool by deletedToolName
        const tool = Object.values(drawToolsConfig).find(t => t.id === deletedToolName.replace('dt_', ''));
        if (tool) {
            // Extract the tool name from the text, removing [num] placeholder
            const toolName = tool.text.replace(' [num]', '');
            return `${toolName} ${t.translate('removed')}`;
        }
    }, [deletedToolName]);

    // Auto-dismiss after 4 seconds
    useEffect(() => {
        if (isVisible) {
            timeoutRef.current = setTimeout(() => {
                onDismiss?.();
            }, 4000);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            };
        }
    }, [isVisible, onDismiss]);

    // Handle escape key to dismiss
    const handleEscapeKey = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onDismiss?.();
            }
        },
        [onDismiss]
    );

    useEffect(() => {
        if (isVisible) {
            document.addEventListener('keydown', handleEscapeKey);
            return () => {
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [isVisible, handleEscapeKey]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            ref={snackbarRef}
            className={classNames('sc-deletion-snackbar', className)}
            role='alert'
            aria-live='polite'
        >
            <div className='sc-deletion-snackbar__content'>
                <span className='sc-deletion-snackbar__message'>{getDeletionMessage()}</span>
                <button
                    className='sc-deletion-snackbar__close'
                    onClick={onDismiss}
                    aria-label={t.translate('Close')}
                    type='button'
                >
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
});

export default DeletionSnackbar;
