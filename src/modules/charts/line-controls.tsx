// Line controls component for TradeDash chart header
// Provides UI for managing horizontal price lines

import { useState, useRef, useEffect, useCallback } from 'react';
import type { HorizontalLineData } from './types';

// Predefined colors for line selection
const LINE_COLORS = [
  '#f59e0b', // amber-500 (default)
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

interface LineControlsProps {
  lines: HorizontalLineData[];
  onAddLine: (price: number, color?: string) => void;
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    updates: { price?: number; color?: string }
  ) => void;
  onClearAll: () => void;
  maxLines?: number;
}

/**
 * Format price with appropriate decimal places
 */
function formatPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else if (price >= 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
}

/**
 * Individual line item component
 */
function LineItem({
  line,
  onRemove,
  onUpdateColor,
}: {
  line: HorizontalLineData;
  onRemove: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  return (
    <div
      className="flex items-center justify-between py-2 px-2 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
      style={{ borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center gap-2">
        {/* Color indicator */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-4 h-4 rounded-full border border-[var(--border-color)] hover:scale-110 transition-transform"
            style={{ backgroundColor: line.color }}
            title="Change color"
            aria-label="Change line color"
          />

          {/* Color picker dropdown */}
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              className="absolute left-0 top-full mt-1 p-2 rounded shadow-lg z-50"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="grid grid-cols-4 gap-1">
                {LINE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onUpdateColor(line.id, color);
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      border:
                        color === line.color
                          ? '2px solid var(--text-primary)'
                          : '1px solid var(--border-color)',
                    }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        <span
          className="font-mono text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatPrice(line.price)}
        </span>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onRemove(line.id)}
        className="p-1 rounded hover:bg-[var(--accent-danger)] hover:bg-opacity-20 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="Remove line"
        aria-label="Remove line"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Line controls component for managing horizontal price lines
 */
export function LineControls({
  lines,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  onClearAll,
  maxLines = 10,
}: LineControlsProps) {
  const [newPrice, setNewPrice] = useState('');
  const [selectedColor, setSelectedColor] = useState(LINE_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = lines.length < maxLines;

  const handleAddLine = useCallback(() => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) return;

    onAddLine(price, selectedColor);
    setNewPrice('');
  }, [newPrice, selectedColor, onAddLine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddLine();
      }
    },
    [handleAddLine]
  );

  const handleUpdateColor = useCallback(
    (id: string, color: string) => {
      onUpdateLine(id, { color });
    },
    [onUpdateLine]
  );

  return (
    <div
      className="p-3 rounded shadow-lg w-64"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <span
          className="font-semibold text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          Price Lines
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {lines.length}/{maxLines}
        </span>
      </div>

      {/* Add new line */}
      {canAddMore && (
        <div className="mb-3">
          <div className="flex gap-2 mb-2">
            <input
              ref={inputRef}
              type="number"
              step="any"
              placeholder="Enter price..."
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleAddLine}
              disabled={!newPrice || parseFloat(newPrice) <= 0}
              className="px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
              }}
              title="Add line"
              aria-label="Add line"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Color selection */}
          <div className="flex gap-1 flex-wrap">
            {LINE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                style={{
                  backgroundColor: color,
                  border:
                    color === selectedColor
                      ? '2px solid var(--text-primary)'
                      : '1px solid var(--border-color)',
                }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lines list */}
      <div className="max-h-48 overflow-y-auto">
        {lines.length === 0 ? (
          <div
            className="text-center py-4 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            No price lines yet
            <br />
            <span className="text-xs">Shift+Click chart to add</span>
          </div>
        ) : (
          lines
            .sort((a, b) => b.price - a.price)
            .map((line) => (
              <LineItem
                key={line.id}
                line={line}
                onRemove={onRemoveLine}
                onUpdateColor={handleUpdateColor}
              />
            ))
        )}
      </div>

      {/* Clear all button */}
      {lines.length > 0 && (
        <button
          onClick={onClearAll}
          className="w-full mt-3 py-1.5 text-sm rounded transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--accent-danger)',
            color: '#ffffff',
          }}
        >
          Clear All
        </button>
      )}
    </div>
  );
}

/**
 * Compact line button for chart header
 */
export function LineControlsButton({
  lineCount,
  onClick,
  isActive,
}: {
  lineCount: number;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors hover:opacity-80 ${
        isActive ? 'bg-[var(--bg-tertiary)]' : ''
      }`}
      style={{ color: 'var(--text-secondary)' }}
      title="Price Lines"
      aria-label="Toggle price lines panel"
      aria-expanded={isActive}
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
        </svg>
        {lineCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] flex items-center justify-center"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            {lineCount > 9 ? '9+' : lineCount}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * Context menu for line operations on the chart
 */
export function LineContextMenu({
  position,
  line,
  onClose,
  onEdit,
  onChangeColor,
  onDelete,
}: {
  position: { x: number; y: number };
  line: HorizontalLineData | null;
  onClose: () => void;
  onEdit: (line: HorizontalLineData) => void;
  onChangeColor: (line: HorizontalLineData, color: string) => void;
  onDelete: (line: HorizontalLineData) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!line) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 py-1 rounded shadow-lg min-w-[140px]"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <button
        onClick={() => {
          onEdit(line);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
        style={{ color: 'var(--text-primary)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Price
      </button>

      <div className="px-3 py-2">
        <span
          className="text-xs block mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Change Color
        </span>
        <div className="flex gap-1">
          {LINE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onChangeColor(line, color);
                onClose();
              }}
              className="w-4 h-4 rounded-full hover:scale-110 transition-transform"
              style={{
                backgroundColor: color,
                border:
                  color === line.color
                    ? '2px solid var(--text-primary)'
                    : '1px solid var(--border-color)',
              }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <div
        className="my-1"
        style={{ borderTop: '1px solid var(--border-color)' }}
      />

      <button
        onClick={() => {
          onDelete(line);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--accent-danger)] hover:bg-opacity-20 transition-colors flex items-center gap-2"
        style={{ color: 'var(--accent-danger)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  );
}
