import React, { useState, useEffect } from 'react';
import { getLicenses, createLicense, renewLicense, deactivateLicense, deleteLicense, loginUser, logoutUser, registerUser, updateLicense, createPayment, getPaymentsByLicense, getPaymentSummary } from './api';
import { FaPlus, FaSync, FaBan, FaCheck, FaCopy, FaTrash, FaSignOutAlt, FaEye } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  // Form State moved up to fix Hook order
  const [formData, setFormData] = useState({
    productId: 'LunIA_POS',
    clientId: '',
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    licenseType: 'monthly',
    maxDevices: 1
  });

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewingLicense, setRenewingLicense] = useState(null);
  const [renewType, setRenewType] = useState('monthly');
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [paymentsLicense, setPaymentsLicense] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ totalAmount: 0, count: 0 });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    status: 'paid',
    method: 'transfer',
    transactionId: '',
    periodEnd: ''
  });
  const [paymentsFilter, setPaymentsFilter] = useState({ start: '', end: '' });
  const [licenseFilter, setLicenseFilter] = useState('all');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('all');
  const [showSelectPaymentsModal, setShowSelectPaymentsModal] = useState(false);

  const daysLeft = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const warningDays = parseInt(import.meta.env.VITE_EXPIRY_WARNING_DAYS || '15', 10);
  const dayBadgeClass = (d) => {
    if (d === null) return 'bg-gray-100 text-gray-800';
    if (d <= 0) return 'bg-red-100 text-red-800';
    if (d <= warningDays) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const licenseTypeMap = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    biannual: 'Semestral',
    annual: 'Anual',
    perpetual: 'Vitalicia',
    trial: 'Prueba'
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const data = await getLicenses();
      setLicenses(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando licencias. Asegúrate de que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(loginData.email, loginData.password);
      setUser(data.data);
      toast.success(`Bienvenido ${data.data.name}`);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(registerData.name, registerData.email, registerData.password);
      toast.success('Usuario creado exitosamente');
      setShowRegisterModal(false);
      setRegisterData({ name: '', email: '', password: '' });
    } catch (error) {
      toast.error(error);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createLicense(formData);
      toast.success('Licencia creada exitosamente');
      setShowModal(false);
      fetchLicenses();
      setFormData({
        productId: 'LunIA_POS',
        clientId: '',
        restaurantName: '',
        email: '',
        phone: '',
        address: '',
        licenseType: 'monthly',
        maxDevices: 1
      });
    } catch (error) {
      toast.error('Error creando licencia: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRenewClick = (license) => {
    setRenewingLicense(license);
    setRenewType(license.licenseType || 'monthly');
    setShowRenewModal(true);
  };

  const confirmRenew = async () => {
    if (!renewingLicense) return;
    
    try {
      await renewLicense({ 
        licenseKey: renewingLicense.licenseKey, 
        newLicenseType: renewType 
      });
      toast.success('Licencia renovada exitosamente');
      setShowRenewModal(false);
      fetchLicenses();
    } catch (error) {
      toast.error('Error al renovar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeactivate = async (key) => {
    if(!window.confirm('¿Seguro que deseas desactivar esta licencia?')) return;
    try {
      await deactivateLicense({ licenseKey: key });
      toast.warning('Licencia desactivada');
      fetchLicenses();
    } catch (error) {
      toast.error('Error al desactivar');
    }
  };

  const handleDelete = async (key) => {
    if(!window.confirm('¿ESTÁS SEGURO? Esto eliminará permanentemente la licencia de la base de datos.')) return;
    try {
      await deleteLicense({ licenseKey: key });
      toast.error('Licencia eliminada permanentemente');
      fetchLicenses();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const calculateNewExpiration = (type) => {
    const today = new Date();
    let newDate = new Date(today);
    
    switch(type) {
      case 'trial':
        newDate.setDate(today.getDate() + 15);
        break;
      case 'monthly':
        newDate.setMonth(today.getMonth() + 1);
        break;
      case 'quarterly':
        newDate.setMonth(today.getMonth() + 3);
        break;
      case 'biannual':
        newDate.setMonth(today.getMonth() + 6);
        break;
      case 'annual':
        newDate.setFullYear(today.getFullYear() + 1);
        break;
      case 'perpetual':
        newDate.setFullYear(today.getFullYear() + 99);
        break;
      default:
        return;
    }
    
    setEditingLicense({
      ...editingLicense,
      expirationDate: newDate.toISOString().split('T')[0]
    });
    toast.info('Fecha de expiración recalculada desde HOY');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateLicense(editingLicense);
      toast.success('Licencia actualizada correctamente');
      setShowDetailsModal(false);
      fetchLicenses();
    } catch (error) {
      toast.error('Error al actualizar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewDetails = (license) => {
    setEditingLicense({ ...license });
    setShowDetailsModal(true);
  };
  
  const handleOpenPayments = async (license) => {
    try {
      setPaymentsLicense(license);
      setShowPaymentsModal(true);
      const listRes = await getPaymentsByLicense(license.licenseKey, paymentsFilter);
      setPayments(listRes.data || []);
      const summaryRes = await getPaymentSummary(license.licenseKey);
      setPaymentSummary(summaryRes.data || { totalAmount: 0, count: 0 });
    } catch (error) {
      toast.error('Error cargando pagos: ' + (error.response?.data?.message || error.message));
    }
  };

  const applyPaymentsFilter = async () => {
    if (!paymentsLicense) return;
    try {
      const listRes = await getPaymentsByLicense(paymentsLicense.licenseKey, paymentsFilter);
      setPayments(listRes.data || []);
    } catch (error) {
      toast.error('Error filtrando pagos: ' + (error.response?.data?.message || error.message));
    }
  };

  const exportPaymentsCsv = () => {
    const headers = ['Fecha','Monto','Moneda','Estado','Método','Transacción'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toISOString(),
      p.amount,
      p.currency || 'USD',
      p.status,
      p.method,
      p.transactionId || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${paymentsLicense?.licenseKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!paymentsLicense) return;
    try {
      const payload = {
        licenseKey: paymentsLicense.licenseKey,
        amount: parseFloat(paymentForm.amount),
        currency: paymentForm.currency,
        status: paymentForm.status,
        method: paymentForm.method,
        transactionId: paymentForm.transactionId || undefined,
        periodEnd: paymentForm.periodEnd ? new Date(paymentForm.periodEnd) : undefined
      };
      await createPayment(payload);
      toast.success('Pago registrado');
      const listRes = await getPaymentsByLicense(paymentsLicense.licenseKey);
      setPayments(listRes.data || []);
      const summaryRes = await getPaymentSummary(paymentsLicense.licenseKey);
      setPaymentSummary(summaryRes.data || { totalAmount: 0, count: 0 });
      setPaymentForm({
        amount: '',
        currency: 'USD',
        status: 'paid',
        method: 'transfer',
        transactionId: '',
        periodEnd: ''
      });
      fetchLicenses();
    } catch (error) {
      toast.error('Error creando pago: ' + (error.response?.data?.message || error.message));
    }
  };

  const isPaidUp = (license) => {
    if (!license?.expirationDate) return false;
    const today = new Date();
    return license.status === 'active' && new Date(license.expirationDate) > today;
  };

  const filteredLicenses = licenses.filter(l => {
    if (licenseFilter === 'all') return true;
    return l.licenseType === licenseFilter;
  });
  const statusFilteredLicenses = filteredLicenses.filter(l => {
    if (licenseStatusFilter === 'all') return true;
    return l.status === licenseStatusFilter;
  });
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Copiado al portapapeles');
  };

  // Si no está logueado, mostrar pantalla de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar Sesión</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                value={loginData.email}
                onChange={e => setLoginData({...loginData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold transition"
            >
              Entrar
            </button>
          </form>
          <ToastContainer position="bottom-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Licencias - lunIA SaaS</h1>
            <p className="text-gray-500">Administración centralizada de licencias POS</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Crear Usuario
            </button>
            <button 
              onClick={() => setShowSelectPaymentsModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Ver Pagos
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
            >
              <FaSignOutAlt /> Salir
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md"
            >
              <FaPlus /> Nueva Licencia
            </button>
          </div>
        </div>

        {/* Payments Modal */}
        {showPaymentsModal && paymentsLicense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Pagos - {paymentsLicense.clientId}</h2>
                <button 
                  onClick={() => { setShowPaymentsModal(false); setPaymentsLicense(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Resumen</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Pagos: <span className="font-bold">${paymentSummary.totalAmount?.toFixed?.(2) || 0}</span></p>
                    <p className="text-sm text-gray-600">Nº Operaciones: <span className="font-bold">{paymentSummary.count || 0}</span></p>
                  </div>
                  <h3 className="font-semibold text-gray-700 mt-6 mb-3">Filtrar</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={paymentsFilter.start}
                        onChange={e => setPaymentsFilter({ ...paymentsFilter, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={paymentsFilter.end}
                        onChange={e => setPaymentsFilter({ ...paymentsFilter, end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={applyPaymentsFilter}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg"
                    >
                      Aplicar Filtro
                    </button>
                    <button 
                      type="button"
                      onClick={exportPaymentsCsv}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                    >
                      Exportar CSV
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-700 mt-6 mb-3">Registrar Pago</h3>
                  <form onSubmit={handleCreatePayment} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                      <input 
                        type="number" step="0.01" required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        value={paymentForm.amount}
                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          value={paymentForm.status}
                          onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}
                        >
                          <option value="paid">Pagado</option>
                          <option value="pending">Pendiente</option>
                          <option value="failed">Fallido</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          value={paymentForm.method}
                          onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                        >
                          <option value="transfer">Transferencia</option>
                          <option value="cash">Efectivo</option>
                          <option value="card">Tarjeta</option>
                          <option value="paypal">PayPal</option>
                          <option value="stripe">Stripe</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID Transacción</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={paymentForm.transactionId}
                        onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expira (por pago)</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        value={paymentForm.periodEnd}
                        onChange={e => setPaymentForm({ ...paymentForm, periodEnd: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Si se especifica y el pago está “Pagado”, se renovará la licencia hasta esa fecha.</p>
                    </div>
                    <button 
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Guardar Pago
                    </button>
                  </form>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Historial</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2">Monto</th>
                          <th className="px-4 py-2">Estado</th>
                          <th className="px-4 py-2">Método</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payments.length === 0 ? (
                          <tr><td colSpan="4" className="px-4 py-3 text-gray-500">Sin pagos</td></tr>
                        ) : payments.map(p => (
                          <tr key={p._id}>
                            <td className="px-4 py-2 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm">${p.amount?.toFixed?.(2) || p.amount}</td>
                            <td className="px-4 py-2 text-sm capitalize">{p.status}</td>
                            <td className="px-4 py-2 text-sm capitalize">{p.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showSelectPaymentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Ver Pagos</h2>
                <button 
                  onClick={() => setShowSelectPaymentsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona una licencia</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  onChange={async (e) => {
                    const id = e.target.value;
                    const license = licenses.find(l => l._id === id);
                    if (license) {
                      setShowSelectPaymentsModal(false);
                      await handleOpenPayments(license);
                    }
                  }}
                >
                  <option value="">Elegir...</option>
                  {licenses.map(l => (
                    <option key={l._id} value={l._id}>
                      {(l.clientName || l.clientId) + ' - ' + (l.restaurantName || '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-gray-700">Filtro tipo:</label>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={licenseFilter}
            onChange={e => setLicenseFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
            <option value="biannual">Semestral</option>
            <option value="annual">Anual</option>
            <option value="perpetual">Vitalicia</option>
            <option value="trial">Prueba</option>
          </select>
          <label className="text-sm text-gray-700 ml-4">Estado:</label>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            value={licenseStatusFilter}
            onChange={e => setLicenseStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">Activa</option>
            <option value="expired">Expirada</option>
            <option value="suspended">Inactiva</option>
          </select>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cliente / Restaurante</th>
                  <th className="px-6 py-4 font-semibold">Clave de Licencia</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Pago</th>
                  <th className="px-6 py-4 font-semibold">Expiración</th>
                  <th className="px-6 py-4 font-semibold">Días</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Cargando licencias...
                    </td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay licencias registradas.
                    </td>
                  </tr>
                ) : (
                  statusFilteredLicenses.map((license) => (
                    <tr key={license._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{license.clientName || license.clientId}</div>
                        <div className="text-sm text-gray-500">{license.restaurantName}</div>
                        <div className="text-xs text-gray-400">{license.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-700">
                            {license.licenseKey.substring(0, 8)}...
                          </code>
                          <button 
                            onClick={() => copyToClipboard(license.licenseKey)}
                            className="text-gray-400 hover:text-blue-500 transition"
                            title="Copiar clave completa"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {licenseTypeMap[license.licenseType] || license.licenseType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          license.status === 'active' ? 'bg-green-100 text-green-800' : 
                          license.status === 'pending_payment' ? 'bg-orange-100 text-orange-800' :
                          license.status === 'expired' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {license.status === 'active' ? 'Activa' : 
                           license.status === 'pending_payment' ? 'Pendiente' :
                           license.status === 'expired' ? 'Expirada' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isPaidUp(license) ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {isPaidUp(license) ? 'Al día' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const d = daysLeft(license.expirationDate);
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dayBadgeClass(d)}`}>
                              {d !== null ? d : 'N/A'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenPayments(license)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition"
                            title="Pagos"
                          >
                            $
                          </button>
                          <button 
                            onClick={() => handleViewDetails(license)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                            title="Ver Detalles"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleRenewClick(license)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
                            title="Renovar"
                          >
                            <FaSync />
                          </button>
                          <button 
                            onClick={() => handleDeactivate(license.licenseKey)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition"
                            title="Desactivar"
                          >
                            <FaBan />
                          </button>
                          <button 
                            onClick={() => handleDelete(license.licenseKey)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                            title="Eliminar permanentemente"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Nueva Licencia</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Restaurante</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    value={formData.restaurantName}
                    onChange={e => setFormData({...formData, restaurantName: e.target.value})}
                    placeholder="Ej. Tacos El Rey"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <div className="flex gap-2 items-center">
                        <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.licenseType}
                        onChange={e => setFormData({...formData, licenseType: e.target.value})}
                        >
                        <option value="trial">Prueba</option>
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="biannual">Semestral</option>
                        <option value="annual">Anual</option>
                        <option value="perpetual">Vitalicia</option>
                        
                        </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="contacto@restaurante.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                      value={formData.licenseType}
                      onChange={e => setFormData({...formData, licenseType: e.target.value})}
                    >
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="biannual">Semestral</option>
                      <option value="annual">Anual</option>
                      <option value="perpetual">Vitalicia</option>
                      <option value="trial">Prueba (15 días)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivos</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                      value={formData.maxDevices}
                      onChange={e => setFormData({...formData, maxDevices: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-bold shadow-lg transition mt-4"
                >
                  Generar Licencia
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Register Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Crear Usuario</h2>
                <button 
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={registerData.name}
                    onChange={e => setRegisterData({...registerData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={registerData.email}
                    onChange={e => setRegisterData({...registerData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={registerData.password}
                    onChange={e => setRegisterData({...registerData, password: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition"
                >
                  Registrar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Details/Edit Modal */}
        {showDetailsModal && editingLicense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Detalles de Licencia</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Licencia Key</p>
                    <code className="text-sm font-mono break-all text-blue-600">{editingLicense.licenseKey}</code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente ID</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingLicense.clientId}
                            onChange={e => setEditingLicense({...editingLicense, clientId: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurante</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingLicense.restaurantName}
                            onChange={e => setEditingLicense({...editingLicense, restaurantName: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingLicense.email}
                    onChange={e => setEditingLicense({...editingLicense, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input 
                            type="tel" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingLicense.phone || ''}
                            onChange={e => setEditingLicense({...editingLicense, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Dispositivos</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingLicense.maxDevices}
                            onChange={e => setEditingLicense({...editingLicense, maxDevices: parseInt(e.target.value)})}
                        />
                    </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                    value={editingLicense.address || ''}
                    onChange={e => setEditingLicense({...editingLicense, address: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dominio/IP Autorizado</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingLicense.authorizedDomainOrIP}
                    onChange={e => setEditingLicense({...editingLicense, authorizedDomainOrIP: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Perfiles permitidos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Admin','Cashier','Waiter','Kitchen','Delivery'].map(role => (
                      <label key={role} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={Array.isArray(editingLicense.allowedRoles) ? editingLicense.allowedRoles.includes(role) : ['Admin','Cashier'].includes(role)}
                          onChange={e => {
                            const current = Array.isArray(editingLicense.allowedRoles) ? editingLicense.allowedRoles : ['Admin','Cashier'];
                            const next = e.target.checked ? [...new Set([...current, role])] : current.filter(r => r !== role);
                            setEditingLicense({ ...editingLicense, allowedRoles: next });
                          }}
                        />
                        <span>{{ Admin: 'Administrador', Cashier: 'Cajero', Waiter: 'Mesero', Kitchen: 'Cocina', Delivery: 'Repartidor' }[role]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Expiración</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingLicense.expirationDate ? new Date(editingLicense.expirationDate).toISOString().split('T')[0] : ''}
                    onChange={e => setEditingLicense({...editingLicense, expirationDate: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        type="button"
                        onClick={() => setShowDetailsModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
                    >
                        Guardar Cambios
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Renew Modal */}
        {showRenewModal && renewingLicense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Renovar Licencia</h2>
                <button 
                  onClick={() => setShowRenewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Renovando licencia para:</p>
                    <p className="font-bold text-gray-800">{renewingLicense.clientName || renewingLicense.clientId}</p>
                    <p className="text-xs text-gray-500 mt-1">Vence: {renewingLicense.expirationDate ? new Date(renewingLicense.expirationDate).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Renovación</label>
                    <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                        value={renewType}
                        onChange={e => setRenewType(e.target.value)}
                    >
                        <option value="monthly">Mensual (1 mes)</option>
                        <option value="quarterly">Trimestral (3 meses)</option>
                        <option value="biannual">Semestral (6 meses)</option>
                        <option value="annual">Anual (1 año)</option>
                        <option value="perpetual">Vitalicia (99 años)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={() => setShowRenewModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmRenew}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition"
                    >
                        Confirmar Renovación
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="bottom-right" />
      </div>
    </div>
  );
}

export default App;
