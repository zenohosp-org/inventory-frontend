import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertCircle, Clock, Plus, Download, Filter } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 1250,
    lowStockItems: 34,
    pendingOrders: 12,
    transfersInProgress: 5,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'stock_in',
      product: 'Cefixime 500mg Tablets',
      quantity: 500,
      location: 'Pharmacy Main Store',
      timestamp: '2024-04-03 14:30',
      user: 'John Doe',
      status: 'completed',
    },
    {
      id: 2,
      type: 'transfer',
      product: 'Paracetamol 650mg Tablets',
      quantity: 250,
      location: 'Ward 3 → Pharmacy',
      timestamp: '2024-04-03 13:15',
      user: 'Jane Smith',
      status: 'completed',
    },
    {
      id: 3,
      type: 'stock_out',
      product: 'Amoxicillin 250mg Syrup',
      quantity: 100,
      location: 'Pediatric Ward',
      timestamp: '2024-04-03 11:45',
      user: 'Dr. Admin',
      status: 'completed',
    },
    {
      id: 4,
      type: 'adjustment',
      product: 'Metformin 500mg Tablets',
      quantity: -25,
      location: 'Diabetes Clinic',
      timestamp: '2024-04-03 10:20',
      user: 'Mary Johnson',
      status: 'completed',
    },
    {
      id: 5,
      type: 'stock_in',
      product: 'Ciprofloxacin 500mg Tablets',
      quantity: 300,
      location: 'Pharmacy Main Store',
      timestamp: '2024-04-02 16:45',
      user: 'John Doe',
      status: 'completed',
    },
  ]);

  const [lowStockItems, setLowStockItems] = useState([
    {
      id: 1,
      productName: 'Insulin Glargine 100 IU/mL',
      sku: 'INS-GLR-100',
      currentStock: 15,
      minLevel: 50,
      unit: 'vials',
      reorderQty: 200,
      lastRestocked: '2024-03-28',
    },
    {
      id: 2,
      productName: 'Nitroglycerin Sublingual Tablets',
      sku: 'NTG-SBL-0.6',
      currentStock: 8,
      minLevel: 30,
      unit: 'bottles',
      reorderQty: 100,
      lastRestocked: '2024-03-25',
    },
    {
      id: 3,
      productName: 'Epinephrine 0.3mg Auto-Injectors',
      sku: 'EPI-AUTO-0.3',
      currentStock: 12,
      minLevel: 40,
      unit: 'packs',
      reorderQty: 150,
      lastRestocked: '2024-03-20',
    },
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'stock_in':
        return '📥';
      case 'stock_out':
        return '📤';
      case 'transfer':
        return '↔️';
      case 'adjustment':
        return '⚖️';
      default:
        return '📦';
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'stock_in':
        return 'Stock In';
      case 'stock_out':
        return 'Stock Out';
      case 'transfer':
        return 'Transfer';
      case 'adjustment':
        return 'Adjustment';
      default:
        return 'Activity';
    }
  };

  const getStockStatusColor = (current, min) => {
    const percentage = (current / min) * 100;
    if (percentage < 25) return '#E74C3C';
    if (percentage < 50) return '#F39C12';
    return '#27AE60';
  };

  const handleGenerateReport = () => {
    console.log('Generating report...');
  };

  const handleExportData = () => {
    console.log('Exporting data...');
  };

  const handleAddStock = () => {
    console.log('Adding stock...');
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Inventory Dashboard</h1>
        <p className="page-subtitle">
          Welcome back! Here's your pharmaceutical inventory overview.
        </p>
      </div>

      {/* Page Actions */}
      <div className="page-actions">
        <button className="btn btn-primary" onClick={handleAddStock}>
          <Plus size={18} />
          Add Stock
        </button>
        <button className="btn btn-secondary" onClick={handleExportData}>
          <Download size={18} />
          Export Data
        </button>
        <button className="btn btn-secondary" onClick={handleGenerateReport}>
          <Filter size={18} />
          Generate Report
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="card-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{stats.totalProducts}</div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              Active items in system
            </p>
          </div>
          <div className="stat-icon">📦</div>
        </div>

        <div className="stat-card warning">
          <div>
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value">{stats.lowStockItems}</div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              Require reordering
            </p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#FEF3C7' }}>
            ⚠️
          </div>
        </div>

        <div className="stat-card success">
          <div>
            <div className="stat-label">Pending Orders</div>
            <div className="stat-value">{stats.pendingOrders}</div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              Awaiting delivery
            </p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#E6F7ED' }}>
            🛒
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--color-info)' }}>
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.transfersInProgress}</div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              Transfers in transit
            </p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#EBF5FF' }}>
            🚚
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-8)' }}>
          <div className="card-header">
            <h3 className="card-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
              Critical Stock Alerts
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Product Name</th>
                  <th style={{ width: '15%' }}>Current Stock</th>
                  <th style={{ width: '15%' }}>Min Level</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Reorder Qty</th>
                  <th style={{ width: '10%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ marginBottom: 'var(--spacing-2)' }}>
                        <strong>{item.productName}</strong>
                      </div>
                      <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                        SKU: {item.sku}
                      </div>
                    </td>
                    <td>
                      <strong>{item.currentStock}</strong> {item.unit}
                    </td>
                    <td>{item.minLevel} {item.unit}</td>
                    <td>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--color-gray-200)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${(item.currentStock / item.minLevel) * 100}%`,
                            backgroundColor: getStockStatusColor(item.currentStock, item.minLevel),
                          }}
                        />
                      </div>
                    </td>
                    <td>{item.reorderQty} {item.unit}</td>
                    <td>
                      <button className="btn btn-sm btn-accent">
                        <Plus size={16} />
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card" style={{ marginBottom: 'var(--spacing-8)' }}>
        <div className="card-header">
          <h3 className="card-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <Clock size={24} style={{ color: 'var(--color-primary)' }} />
            Recent Activity
          </h3>
          <button className="btn btn-sm btn-ghost">View All</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Type</th>
                <th style={{ width: '30%' }}>Product</th>
                <th style={{ width: '15%' }}>Quantity</th>
                <th style={{ width: '20%' }}>Location</th>
                <th style={{ width: '12%' }}>User</th>
                <th style={{ width: '18%' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <span style={{ fontSize: '18px', marginRight: 'var(--spacing-2)' }}>
                      {getActivityIcon(activity.type)}
                    </span>
                    <span className="badge" style={{ fontSize: 'var(--fs-xs)' }}>
                      {getActivityLabel(activity.type)}
                    </span>
                  </td>
                  <td>
                    <strong>{activity.product}</strong>
                  </td>
                  <td>
                    <span style={{ color: activity.quantity > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {activity.quantity > 0 ? '+' : ''}{activity.quantity}
                    </span>
                  </td>
                  <td className="text-muted">{activity.location}</td>
                  <td>{activity.user}</td>
                  <td className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                    {activity.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
