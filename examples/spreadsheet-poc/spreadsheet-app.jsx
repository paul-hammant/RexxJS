/**
 * SpreadsheetApp - React components for the spreadsheet UI
 *
 * Components:
 * - Cell: Individual spreadsheet cell
 * - Grid: Spreadsheet grid
 * - FormulaBar: Formula/value editor
 * - App: Main application with state management
 */

const { useState, useEffect, useRef, useCallback } = React;

/**
 * Cell Component
 */
function Cell({ cellRef, cell, isSelected, onSelect, onEdit }) {
    const inputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditValue(cell.expression ? '=' + cell.expression : cell.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onEdit(cellRef, editValue);
            setIsEditing(false);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleBlur = () => {
        if (isEditing) {
            onEdit(cellRef, editValue);
            setIsEditing(false);
        }
    };

    const displayValue = cell.error ? cell.value : (cell.value || '');
    const hasError = !!cell.error;
    const hasFormula = !!cell.expression;

    return (
        <div
            className={`cell ${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''} ${hasFormula ? 'formula' : ''}`}
            onClick={() => onSelect(cellRef)}
            onDoubleClick={handleDoubleClick}
            title={cell.error || (cell.expression ? '=' + cell.expression : '')}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="cell-input"
                />
            ) : (
                <span className="cell-value">{displayValue}</span>
            )}
        </div>
    );
}

/**
 * Column Header Component
 */
function ColumnHeader({ col }) {
    return (
        <div className="column-header">
            {SpreadsheetModel.colNumberToLetter(col)}
        </div>
    );
}

/**
 * Row Header Component
 */
function RowHeader({ row }) {
    return (
        <div className="row-header">
            {row}
        </div>
    );
}

/**
 * Grid Component
 */
function Grid({ model, selectedCell, onSelectCell, onEditCell, visibleRows, visibleCols }) {
    const rows = [];

    // Header row with column letters
    const headerRow = (
        <div key="header" className="grid-row header-row">
            <div className="corner-cell"></div>
            {Array.from({ length: visibleCols }, (_, i) => (
                <ColumnHeader key={i} col={i + 1} />
            ))}
        </div>
    );
    rows.push(headerRow);

    // Data rows
    for (let row = 1; row <= visibleRows; row++) {
        const cells = [];

        // Row header
        cells.push(<RowHeader key={`row-${row}`} row={row} />);

        // Data cells
        for (let col = 1; col <= visibleCols; col++) {
            const cellRef = SpreadsheetModel.formatCellRef(col, row);
            const cell = model.getCell(cellRef);
            const isSelected = selectedCell === cellRef;

            cells.push(
                <Cell
                    key={cellRef}
                    cellRef={cellRef}
                    cell={cell}
                    isSelected={isSelected}
                    onSelect={onSelectCell}
                    onEdit={onEditCell}
                />
            );
        }

        rows.push(
            <div key={`row-${row}`} className="grid-row">
                {cells}
            </div>
        );
    }

    return <div className="grid">{rows}</div>;
}

/**
 * Formula Bar Component
 */
function FormulaBar({ selectedCell, model, onEdit }) {
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (selectedCell) {
            const cell = model.getCell(selectedCell);
            setEditValue(cell.expression ? '=' + cell.expression : cell.value);
        } else {
            setEditValue('');
        }
    }, [selectedCell, model]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (selectedCell) {
                onEdit(selectedCell, editValue);
            }
        }
    };

    const handleChange = (e) => {
        setEditValue(e.target.value);
    };

    return (
        <div className="formula-bar">
            <label className="cell-ref-label">{selectedCell || 'No cell selected'}</label>
            <input
                ref={inputRef}
                type="text"
                className="formula-input"
                value={editValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter value or =formula"
                disabled={!selectedCell}
            />
        </div>
    );
}

/**
 * Info Panel Component
 */
function InfoPanel() {
    return (
        <div className="info-panel">
            <h3>RexxJS Spreadsheet POC</h3>
            <p><strong>Features:</strong></p>
            <ul>
                <li>Cell values and formulas (start with <code>=</code>)</li>
                <li>Cell references: <code>=A1 + B2</code></li>
                <li>Function pipelines: <code>=A1 |&gt; UPPER |&gt; LENGTH</code></li>
                <li>Range functions: <code>=SUM_RANGE("A1:A5")</code></li>
                <li>Built-in RexxJS functions (200+ available)</li>
                <li>Extra libraries via REQUIRE</li>
            </ul>
            <p><strong>Examples to try:</strong></p>
            <ul>
                <li>Put <code>10</code> in A1, <code>20</code> in A2</li>
                <li>Put <code>=A1 + A2</code> in A3</li>
                <li>Put <code>=A3 * 2</code> in A4</li>
                <li>Put <code>="Hello" |&gt; UPPER |&gt; LENGTH</code> in B1</li>
                <li>Put <code>=AVERAGE_RANGE("A1:A4")</code> in A5</li>
            </ul>
            <p><strong>Function Types:</strong></p>
            <ul>
                <li><strong>Built-in:</strong> UPPER, SUBSTR, ROUND, etc.</li>
                <li><strong>Spreadsheet:</strong> SUM_RANGE, AVERAGE_RANGE</li>
                <li><strong>Extra libs:</strong> Use REQUIRE in a cell</li>
            </ul>
        </div>
    );
}

/**
 * Main App Component
 */
function App() {
    const [model, setModel] = useState(null);
    const [adapter, setAdapter] = useState(null);
    const [selectedCell, setSelectedCell] = useState('A1');
    const [sheetName, setSheetName] = useState('Sheet1');
    const [updateCounter, setUpdateCounter] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const visibleRows = 20;
    const visibleCols = 10;

    // Initialize on mount
    useEffect(() => {
        initializeSpreadsheet();
    }, []);

    // Handle hash changes for sheet name
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                setSheetName(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial load

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const initializeSpreadsheet = async () => {
        try {
            setIsLoading(true);

            // Wait for RexxJS to be available
            let attempts = 0;
            while ((typeof RexxInterpreter === 'undefined' || typeof parse === 'undefined') && attempts < 100) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (typeof RexxInterpreter === 'undefined' || typeof parse === 'undefined') {
                throw new Error('RexxJS interpreter failed to load. Please refresh the page.');
            }

            // Create model
            const newModel = new SpreadsheetModel(100, 26);

            // Create adapter
            const newAdapter = new SpreadsheetRexxAdapter(newModel);

            // Initialize RexxJS interpreter
            await newAdapter.initializeInterpreter(RexxInterpreter);
            newAdapter.installSpreadsheetFunctions();

            setModel(newModel);
            setAdapter(newAdapter);
            setIsLoading(false);

            // Load sample data
            loadSampleData(newModel, newAdapter);
        } catch (err) {
            console.error('Failed to initialize spreadsheet:', err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    const loadSampleData = async (model, adapter) => {
        // Sample data to demonstrate features
        const sampleData = {
            'A1': '10',
            'A2': '20',
            'A3': '=A1 + A2',
            'B1': 'Hello',
            'B2': '=UPPER(B1)',
            'C1': '5',
            'C2': '3',
            'C3': '=C1 * C2'
        };

        for (const [ref, content] of Object.entries(sampleData)) {
            await model.setCell(ref, content, adapter);
        }

        setUpdateCounter(c => c + 1);
    };

    const handleEditCell = useCallback(async (cellRef, content) => {
        if (!model || !adapter) return;

        await model.setCell(cellRef, content, adapter);
        setUpdateCounter(c => c + 1);
    }, [model, adapter]);

    const handleSelectCell = useCallback((cellRef) => {
        setSelectedCell(cellRef);
    }, []);

    if (isLoading) {
        return (
            <div className="app loading">
                <div className="loading-message">
                    <h2>Loading RexxJS Spreadsheet...</h2>
                    <p>Initializing interpreter and spreadsheet model...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app error">
                <div className="error-message">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <div className="header">
                <h1>RexxJS Spreadsheet POC</h1>
                <div className="sheet-name">Sheet: {sheetName}</div>
            </div>

            <FormulaBar
                selectedCell={selectedCell}
                model={model}
                onEdit={handleEditCell}
            />

            <div className="main-content">
                <Grid
                    model={model}
                    selectedCell={selectedCell}
                    onSelectCell={handleSelectCell}
                    onEditCell={handleEditCell}
                    visibleRows={visibleRows}
                    visibleCols={visibleCols}
                />

                <InfoPanel />
            </div>
        </div>
    );
}

// Render the app when DOM and RexxJS are ready
if (typeof document !== 'undefined') {
    function renderApp() {
        // Check if RexxJS is available (need both RexxInterpreter and parse)
        if ((typeof RexxInterpreter !== 'undefined' && typeof parse !== 'undefined') || typeof RexxWebLoader !== 'undefined') {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
        } else {
            // RexxJS not ready yet, wait a bit and try again
            setTimeout(renderApp, 100);
        }
    }

    window.addEventListener('DOMContentLoaded', renderApp);
}
