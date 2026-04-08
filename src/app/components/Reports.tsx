import { useState } from "react";
import { BarChart3, Download, Calendar, FileText, TrendingUp, DollarSign, Users, Wrench } from "lucide-react";

export function Reports() {
  const [dateRange, setDateRange] = useState("This Month");
  const [reportType, setReportType] = useState("Revenue");

  const revenueData = [
    { month: "Jan", revenue: 45000, services: 125 },
    { month: "Feb", revenue: 52000, services: 148 },
    { month: "Mar", revenue: 48000, services: 132 },
  ];

  const topServices = [
    { service: "Engine Repair", count: 45, revenue: 98000 },
    { service: "Brake Service", count: 78, revenue: 65000 },
    { service: "Oil Change", count: 156, revenue: 18000 },
    { service: "Tire Replacement", count: 52, revenue: 42000 },
    { service: "Transmission Service", count: 28, revenue: 56000 },
  ];

  const topCompanies = [
    { company: "Swift Logistics", services: 89, revenue: 125000 },
    { company: "Fast Freight Co", services: 67, revenue: 98000 },
    { company: "Global Transport", services: 54, revenue: 87000 },
    { company: "City Movers", services: 43, revenue: 65000 },
  ];

  const mechanicPerformance = [
    { name: "Mike Johnson", services: 45, rating: 4.8, revenue: 78000 },
    { name: "Lisa Anderson", services: 38, rating: 4.9, revenue: 65000 },
    { name: "Tom Wilson", services: 32, rating: 4.7, revenue: 54000 },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed insights and performance metrics</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option>Revenue</option>
              <option>Service Performance</option>
              <option>Mechanic Performance</option>
              <option>Customer Analysis</option>
              <option>Parts Usage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>PDF</option>
              <option>Excel (XLSX)</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£145,000</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp size={16} />
            <span>+15.3%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Services</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">405</p>
          <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm">
            <TrendingUp size={16} />
            <span>+8.2%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Companies</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">28</p>
          <div className="flex items-center gap-1 mt-2 text-purple-600 text-sm">
            <TrendingUp size={16} />
            <span>+3 new</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Service Value</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">£358</p>
          <div className="flex items-center gap-1 mt-2 text-orange-600 text-sm">
            <TrendingUp size={16} />
            <span>+12.1%</span>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-4">
            {revenueData.map((data, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <span className="text-sm font-semibold text-gray-900">£{data.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(data.revenue / 60000) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{data.services} services</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Service</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Count</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((service, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{service.service}</td>
                    <td className="py-3 text-sm text-gray-600">{service.count}</td>
                    <td className="py-3 text-sm font-semibold text-gray-900">£{service.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
          <div className="space-y-4">
            {topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{company.company}</p>
                  <p className="text-sm text-gray-600">{company.services} services</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">£{company.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mechanic Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mechanic Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Mechanic</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Services</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Rating</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {mechanicPerformance.map((mechanic, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{mechanic.name}</td>
                    <td className="py-3 text-sm text-gray-600">{mechanic.services}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ⭐ {mechanic.rating}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-semibold text-gray-900">£{mechanic.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}