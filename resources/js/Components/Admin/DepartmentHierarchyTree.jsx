import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Users, GripVertical, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { departmentApi } from '@/Utils/ApiClient';

const DepartmentHierarchyTree = ({ onSelectDepartment = null, editable = false }) => {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        fetchTree();
    }, []);

    const fetchTree = async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getTree();
            setTree(response);
        } catch (err) {
            setError('Failed to load department hierarchy');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const startEdit = (node) => {
        setEditingId(node.id);
        setEditValues({ name: node.name, code: node.code || '' });
    };

    const handleMoveDepartment = async (deptId, newParentId) => {
        try {
            await departmentApi.moveDepartment(deptId, newParentId);
            await fetchTree();
        } catch (err) {
            console.error('Failed to move department:', err);
        }
    };

    const handleSelectDepartment = (node) => {
        setSelectedNode(node);
        if (onSelectDepartment) {
            onSelectDepartment(node);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Department Hierarchy</h3>
                        <p className="text-sm text-gray-600 mt-1">Organizational structure and reporting lines</p>
                    </div>
                    <button
                        onClick={fetchTree}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="p-6 space-y-2">
                {tree && (
                    <TreeNode
                        node={tree}
                        level={0}
                        expandedNodes={expandedNodes}
                        onToggle={toggleNode}
                        onSelect={handleSelectDepartment}
                        selectedNode={selectedNode}
                        editable={editable}
                        editingId={editingId}
                        onStartEdit={startEdit}
                        onMove={handleMoveDepartment}
                    />
                )}
            </div>

            {/* Details Panel */}
            {selectedNode && (
                <DepartmentDetailsPanel
                    department={selectedNode}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
};

const TreeNode = ({
    node,
    level,
    expandedNodes,
    onToggle,
    onSelect,
    selectedNode,
    editable,
    editingId,
    onStartEdit,
    onMove
}) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
        >
            {/* Node Item */}
            <motion.div
                onClick={() => onSelect(node)}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                }`}
                whileHover={{ x: 4 }}
            >
                {/* Expander */}
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}
                    </button>
                )}
                {!hasChildren && <div className="w-6" />}

                {/* Drag Handle (if editable) */}
                {editable && (
                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                )}

                {/* Department Info */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                        {node.name}
                    </div>
                    {node.code && (
                        <div className="text-xs text-gray-500">{node.code}</div>
                    )}
                </div>

                {/* User Count Badge */}
                <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    <Users size={14} />
                    <span>{node.users_count || 0}</span>
                </div>

                {/* Actions */}
                {editable && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(node);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600"
                    >
                        <Edit2 size={16} />
                    </button>
                )}
            </motion.div>

            {/* Children */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 pl-4 border-l border-gray-300 space-y-1"
                    >
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                expandedNodes={expandedNodes}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                selectedNode={selectedNode}
                                editable={editable}
                                editingId={editingId}
                                onStartEdit={onStartEdit}
                                onMove={onMove}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const DepartmentDetailsPanel = ({ department, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="border-t bg-gray-50 p-6"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-lg font-semibold text-gray-900">{department.name}</h4>
                    {department.code && (
                        <p className="text-sm text-gray-600">{department.code}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{department.users_count || 0}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Subdepartments</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {department.children ? department.children.length : 0}
                    </p>
                </div>
            </div>

            {department.parent_id && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Reporting To</p>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="font-medium text-gray-900">{department.parent?.name || 'N/A'}</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DepartmentHierarchyTree;
