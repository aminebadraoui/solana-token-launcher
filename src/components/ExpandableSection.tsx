'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ExpandableSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

export function ExpandableSection({
    title,
    children,
    defaultExpanded = false,
    icon,
    className = ''
}: ExpandableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [height, setHeight] = useState<number | undefined>(defaultExpanded ? undefined : 0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current) return;

        if (isExpanded) {
            const scrollHeight = contentRef.current.scrollHeight;
            setHeight(scrollHeight);
        } else {
            setHeight(0);
        }
    }, [isExpanded]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`bg-gray-700 rounded-lg border border-gray-600 ${className}`}>
            {/* Header */}
            <button
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-600/50 transition-colors duration-200 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                aria-expanded={isExpanded}
                aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
                <div className="flex items-center space-x-3">
                    {icon && (
                        <div className="flex-shrink-0 text-purple-400">
                            {icon}
                        </div>
                    )}
                    <h4 className="font-semibold text-white">{title}</h4>
                </div>
                <div className="flex-shrink-0">
                    {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Content */}
            <div
                ref={contentRef}
                id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ height }}
            >
                <div className="p-4 pt-0 border-t border-gray-600">
                    <div className="text-gray-300">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
} 