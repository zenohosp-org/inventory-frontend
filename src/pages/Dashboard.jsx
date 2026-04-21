import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertCircle, Clock, Plus } from 'lucide-react';
import axios from 'axios';
import LogStockModal from '../components/LogStockModal';
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
      console.log('Fetching dashboard data...');
      const [stockRes, transRes] = await Promise.all([
        getStockOverview(),
        getStockLogs(),
      ]);

      console.log('Stock Response:', stockRes);
      console.log('Transactions Response:', transRes);

      // Parse JSON strings if necessary
      let stocks = stockRes.data || stockRes;
      let transactions = transRes.data || transRes;
      if (typeof stocks === 'string') stocks = JSON.parse(stocks);
      if (typeof transactions === 'string') transactions = JSON.parse(transactions);
      stocks = Array.isArray(stocks) ? stocks : [];
      transactions = Array.isArray(transactions) ? transactions : [];
      const transactionSlice = transactions.slice(0, 10);

      console.log('Parsed stocks:', stocks);
      console.log('Parsed transactions:', transactions);

      // Calculate stats
      const lowStock = (stocks || []).filter(s => s.quantityAvail <= s.reorderLevel);
      setStats({
        totalProducts: stocks.length,
        lowStockItems: lowStock.length,
        pendingOrders: 0,
        transfersInProgress: 0,
      });

      // Set low stock items
      setLowStockItems(lowStock.slice(0, 3));

      // Format recent activity
      const activity = (transactionSlice || []).map((t, idx) => ({
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
      console.error('Error details:', error.response?.data || error.message);
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
          title={lowStockItems.length === 0 ? "No low stock items to log" : "Add new stock transaction"}
          disabled={lowStockItems.length === 0}
          onClick={() => {
              if (lowStockItems.length > 0) {
                handleLogStockClick(lowStockItems[0]);
              }
          }}
        >
          <Plus size={18} />
          Log Stock
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="card-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{stats.totalProducts}</div>
            <p>Active items in system</p>
          </div>
          <div className="stat-icon">📦</div>
        </div>

        <div className="stat-card warning">
          <div>
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value">{stats.lowStockItems}</div>
            <p>Require reordering</p>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>

        <div className="stat-card success">
          <div>
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{recentActivity.length}</div>
            <p>Last 24 hours</p>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card info">
          <div>
            <div className="stat-label">System Status</div>
            <div className="stat-value text-success">✓</div>
            <p>All systems operational</p>
          </div>
          <div className="stat-icon">✅</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">
              <AlertCircle size={22} />
              Critical Stock Alerts ({lowStockItems.length})
            </h3>
          </div>
          <div className="card-body-flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, idx) => {
                  const pct = Math.min((item.quantityAvail / item.reorderLevel) * 100, 100);
                  const fillClass = pct < 25 ? 'stock-bar-fill-critical' : pct < 50 ? 'stock-bar-fill-warn' : 'stock-bar-fill-ok';
                  return (
                    <tr key={idx}>
                      <td>
                        <strong>{item.itemName}</strong>
                        <span className="subtext">Code: {item.itemCode || 'N/A'}</span>
                      </td>
                      <td><strong>{item.quantityAvail} {item.unit}</strong></td>
                      <td>{item.reorderLevel} {item.unit}</td>
                      <td>
                        <div className="stock-bar-track">
                          <div className={`stock-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-accent" onClick={() => handleLogStockClick(item)}>
                          <Plus size={16} />
                          Log Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={22} />
              Recent Transactions
            </h3>
          </div>
          <div className="card-body-flush">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>User</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                      <span className="badge badge-primary">{getActivityLabel(activity.type)}</span>
                    </td>
                    <td><strong>{activity.product}</strong></td>
                    <td>
                      <span className={activity.quantity > 0 ? 'text-success' : 'text-danger'}>
                        {activity.quantity > 0 ? '+' : ''}{activity.quantity}
                      </span>
                    </td>
                    <td className="text-muted">{activity.location}</td>
                    <td>{activity.user}</td>
                    <td className="text-muted text-xs">{activity.timestamp}</td>
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
