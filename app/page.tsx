import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Laundry Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your laundry business operations with our comprehensive
            management solution. Track orders, manage customers, monitor
            inventory, and grow your business.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-blue-600"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">Order Management</h3>
              <p className="text-gray-600">
                Track orders from pickup to delivery with real-time status
                updates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Customer Tracking</h3>
              <p className="text-gray-600">
                Manage customer information and order history in one place.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-gray-600">
                Get insights into your business performance and revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
