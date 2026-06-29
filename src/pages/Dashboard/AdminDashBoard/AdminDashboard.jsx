import {
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaDollarSign,
} from "react-icons/fa";
const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Products",
      value: "320",
      icon: <FaBoxOpen className="text-3xl text-primary" />,
    },
    {
      title: "Total Orders",
      value: "845",
      icon: <FaShoppingCart className="text-3xl text-success" />,
    },
    {
      title: "Total Users",
      value: "1,245",
      icon: <FaUsers className="text-3xl text-info" />,
    },
    {
      title: "Revenue",
      value: "$24,850",
      icon: <FaDollarSign className="text-3xl text-warning" />,
    },
  ];

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <div
            key={index}
            className="card bg-base-100 shadow-md hover:shadow-xl transition"
          >
            <div className="card-body flex-row items-center justify-between">
              <div>
                <h2 className="text-gray-500 text-sm">{item.title}</h2>

                <p className="text-3xl font-bold mt-2">{item.value}</p>
              </div>

              {item.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow-md mt-8">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>John</td>
                  <td>Added Product</td>
                  <td>
                    <span className="badge badge-success">Done</span>
                  </td>
                </tr>

                <tr>
                  <td>Alex</td>
                  <td>Placed Order</td>
                  <td>
                    <span className="badge badge-warning">Pending</span>
                  </td>
                </tr>

                <tr>
                  <td>Emma</td>
                  <td>Updated Profile</td>
                  <td>
                    <span className="badge badge-info">Updated</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
