import {
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaBoxOpen,
  FaArrowUp,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaStar,
} from "react-icons/fa";

const stats = [
  {
    id: 1,
    title: "Total Sales",
    value: "$28,540",
    icon: FaDollarSign,
    color: "bg-green-500",
    growth: "+18%",
  },
  {
    id: 2,
    title: "Orders",
    value: "1,245",
    icon: FaShoppingCart,
    color: "bg-blue-500",
    growth: "+12%",
  },
  {
    id: 3,
    title: "Customers",
    value: "5,892",
    icon: FaUsers,
    color: "bg-purple-500",
    growth: "+23%",
  },
  {
    id: 4,
    title: "Products",
    value: "328",
    icon: FaBoxOpen,
    color: "bg-orange-500",
    growth: "+8%",
  },
];

const recentOrders = [
  {
    id: "#1052",
    customer: "John Smith",
    product: "iPhone 16 Pro",
    amount: "$1399",
    status: "Delivered",
  },
  {
    id: "#1053",
    customer: "Emma",
    product: "Samsung S25 Ultra",
    amount: "$1299",
    status: "Pending",
  },
  {
    id: "#1054",
    customer: "Michael",
    product: "Google Pixel 10",
    amount: "$999",
    status: "Shipping",
  },
  {
    id: "#1055",
    customer: "David",
    product: "OnePlus 14",
    amount: "$799",
    status: "Delivered",
  },
];

const topProducts = [
  {
    name: "iPhone 16 Pro Max",
    sold: 460,
    revenue: "$642K",
  },
  {
    name: "Samsung Galaxy S25",
    sold: 380,
    revenue: "$451K",
  },
  {
    name: "Nothing Phone 3",
    sold: 270,
    revenue: "$210K",
  },
];

const latestCustomers = [
  "John Smith",
  "Emma Watson",
  "David Miller",
  "Alex",
  "Sarah",
];

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold">Welcome Back 👋</h1>

            <p className="opacity-90 mt-2">
              Here's what's happening with your store today.
            </p>
          </div>

          <button className="btn btn-warning rounded-full px-8">
            View Report
          </button>
        </div>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="bg-base-100 rounded-3xl shadow-lg p-6 hover:-translate-y-1 duration-300"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500">{item.title}</p>

                  <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                </div>

                <div
                  className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl`}
                >
                  <Icon />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-green-500">
                <FaArrowUp />

                <span>{item.growth} this month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics */}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales */}

        <div className="lg:col-span-2 bg-base-100 rounded-3xl shadow-lg p-6">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">Sales Analytics</h2>

            <select className="select select-bordered">
              <option>Last 7 Days</option>

              <option>Last Month</option>
            </select>
          </div>

          <div className="mt-10 h-80 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">📈 Chart Here</h2>

              <p>Connect Recharts / ApexChart later</p>
            </div>
          </div>
        </div>

        {/* Order Status */}

        <div className="bg-base-100 rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Orders Status</h2>

          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FaClock className="text-yellow-500" />
                Pending
              </div>

              <span className="font-bold">35</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FaTruck className="text-blue-500" />
                Shipping
              </div>

              <span className="font-bold">84</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-500" />
                Delivered
              </div>

              <span className="font-bold">960</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-base-100 rounded-3xl shadow-lg p-6 overflow-auto">
          <div className="flex justify-between mb-5">
            <h2 className="text-2xl font-bold">Recent Orders</h2>

            <button className="btn btn-sm btn-primary">View All</button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Order</th>

                <th>Customer</th>

                <th>Product</th>

                <th>Amount</th>

                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>

                  <td>{order.customer}</td>

                  <td>{order.product}</td>

                  <td>{order.amount}</td>

                  <td>
                    <span
                      className={`badge ${
                        order.status === "Delivered"
                          ? "badge-success"
                          : order.status === "Pending"
                            ? "badge-warning"
                            : "badge-info"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar */}

        <div className="space-y-6">
          <div className="bg-base-100 rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-5">Top Products</h2>

            {topProducts.map((item) => (
              <div
                key={item.name}
                className="flex justify-between py-3 border-b last:border-none"
              >
                <div>
                  <h3 className="font-semibold">{item.name}</h3>

                  <p className="text-sm text-gray-500">{item.sold} Sold</p>
                </div>

                <span className="font-bold">{item.revenue}</span>
              </div>
            ))}
          </div>

          <div className="bg-base-100 rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-5">New Customers</h2>

            {latestCustomers.map((user) => (
              <div
                key={user}
                className="flex items-center gap-3 py-3 border-b last:border-none"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                  {user.charAt(0)}
                </div>

                <div>
                  <h3 className="font-semibold">{user}</h3>

                  <div className="flex text-yellow-400">
                    <FaStar />

                    <FaStar />

                    <FaStar />

                    <FaStar />

                    <FaStar />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
