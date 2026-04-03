import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertCircle, Clock, Plus, Download } from 'lucide-react';
import axios from 'axios';
import LogStockModal from './LogStockModal';
import { getStockOverview, getStockLogs } from '../api/client';


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    transfersInProgress: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stockRes, transRes] = await Promise.all([
        getStockOverview(),
        getStockLogs(),
      ]);

      const stocks = stockRes.data || [];
      const transactions = (transRes.data || []).slice(0, 10);

      // Calculate stats
      const lowStock = stocks.filter(s => s.quantityAvail <= s.reorderLevel);
      setStats({
        totalProducts: stocks.length,
        lowStockItems: lowStock.length,
        pendingOrders: 0,
        transfersInProgress: 0,
      });

      // Set low stock items
      setLowStockItems(lowStock.slice(0, 3));

      // Format recent activity
      const activity = transactions.map((t, idx) => ({
        id: idx,
        type: t.transactionType.toLowerCase().replace(/_/g, '_'),
        product: t.itemName,
        quantity: t.quantity,
        location: t.storeName,
        timestamp: new Date(t.createdAt).toLocaleString(),
        user: t.createdBy || 'System',
        status: 'completed',
      }));
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogStockClick = (stock) => {
    // Prepare stock data for modal - ensure all required fields
    const stockData = {
      itemId: stock.itemId,
      storeId: stock.storeId,
      itemName: stock.itemName,
      itemCode: stock.itemCode,
      quantityAvail: stock.quantityAvail,
      unit: stock.unit
    };
    setSelectedStock(stockData);
    setShowLogModal(true);
  };

  const handleLogStockSuccess = () => {
    setShowLogModal(false);
    setSelectedStock(null);
    // Refresh dashboard data
    fetchDashboardData();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase_in':
        return '📥';
      case 'internal_use':
        return '📤';
      case 'transfer':
        return '↔️';
      case 'expired_disposed':
        return '⚖️';
      case 'return':
        return '↩️';
      default:
        return '📦';
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'purchase_in':
        return 'Purchase In';
      case 'internal_use':
        return 'Internal Use';
      case 'transfer':
        return 'Transfer';
      case 'expired_disposed':
        return 'Disposed';
      case 'return':
        return 'Return';
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

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Inventory Dashboard</h1>
        <p className="page-subtitle">
          {loading ? 'Loading overview...' : 'Here\'s your pharmaceutical inventory overview.'}
        </p>
      </div>

      {/* Page Actions */}
      <div className="page-actions">
        <button 
          className="btn btn-primary" 
          title="Add new stock transaction"
          onClick={() => {
            if (lowStockItems.length > 0) {
              handleLogStockClick(lowStockItems[0]);
            }
          }}
          disabled={lowStockItems.length === 0}
        >
          <Plus size={18} />
          Log Stock
        </button>
        <button className="btn btn-secondary" title="Export data to CSV">
          <Download size={18} />
          Export
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
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{recentActivity.length}</div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              Last 24 hours
            </p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#E6F7ED' }}>
            📊
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--color-info)' }}>
          <div>
            <div className="stat-label">System Status</div>
            <div className="stat-value">
              <span style={{ color: 'var(--color-success)', fontSize: 'var(--fs-xl)' }}>✓</span>
            </div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-2)' }}>
              All systems operational
            </p>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#EBF5FF' }}>
            ✅
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-8)' }}>
          <div className="card-header">
            <h3 className="card-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
              Critical Stock Alerts ({lowStockItems.length})
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Product Name</th>
                  <th style={{ width: '15%' }}>Current Stock</th>
                  <th style={{ width: '15%' }}>Min Level</th>
                  <th style={{ width: '20%' }}>Status</th>
                  <th style={{ width: '20%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ marginBottom: 'var(--spacing-2)' }}>
                        <strong>{item.itemName}</strong>
                      </div>
                      <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                        Code: {item.itemCode || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <strong>{item.quantityAvail} {item.unit}</strong>
                    </td>
                    <td>{item.reorderLevel} {item.unit}</td>
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
                            width: `${Math.min((item.quantityAvail / item.reorderLevel) * 100, 100)}%`,
                            backgroundColor: getStockStatusColor(item.quantityAvail, item.reorderLevel),
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-accent"
                        onClick={() => handleLogStockClick(item)}
                      >
                        <Plus size={16} />
                        Log Stock
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
      {recentActivity.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-8)' }}>
          <div className="card-header">
            <h3 className="card-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <Clock size={24} style={{ color: 'var(--color-primary)' }} />
              Recent Transactions
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Type</th>
                  <th style={{ width: '28%' }}>Product</th>
                  <th style={{ width: '12%' }}>Qty</th>
                  <th style={{ width: '18%' }}>Location</th>
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
                      <span className="badge badge-primary" style={{ fontSize: 'var(--fs-xs)' }}>
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
      )}

      {/* Log Stock Modal */}
      {showLogModal && selectedStock && (
        <LogStockModal 
          stock={selectedStock} 
          onClose={() => setShowLogModal(false)}
          onSuccess={handleLogStockSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
