
export function Analytics() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Analytics</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">
          Analytics dashboard will display your sales metrics here.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">$0</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">0%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">$0</div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Coming Soon</h3>
        <p className="text-sm text-blue-700">
          Advanced analytics with AI-powered insights, trends, and recommendations.
        </p>
      </div>
    </div>
  );
}