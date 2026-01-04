import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg">
                                <span className="text-white font-bold">HCMS</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold">E-Learning BNI</h3>
                                <p className="text-xs text-gray-400">Human Capital Management</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Platform pembelajaran digital untuk pengembangan SDM BNI yang terintegrasi dengan sistem pelaporan OJK.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Menu</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Dashboard</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Training</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Laporan</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Sertifikat</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Dokumentasi</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Hubungi Kami</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition">Kebijakan Privasi</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Kontak</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 mt-1 text-blue-400" />
                                <a href="mailto:training@bni.co.id" className="text-gray-400 hover:text-white transition text-sm">training@bni.co.id</a>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="w-4 h-4 mt-1 text-blue-400" />
                                <a href="tel:+62215789999" className="text-gray-400 hover:text-white transition text-sm">+62 (21) 5789999</a>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-1 text-blue-400" />
                                <p className="text-gray-400 text-sm">Jakarta, Indonesia</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Copyright */}
                        <div className="text-gray-400 text-sm">
                            <p>&copy; {currentYear} PT Bank Negara Indonesia (Persero) Tbk. All rights reserved.</p>
                            <p className="mt-1 text-xs">HCMS E-Learning System v1.0</p>
                        </div>

                        {/* Compliance Notice */}
                        <div className="text-gray-400 text-sm text-right">
                            <p className="text-xs mb-2">
                                <span className="inline-block bg-green-900 text-green-200 px-2 py-1 rounded">
                                    ✓ Compliant with OJK & BNI Standards
                                </span>
                            </p>
                            <p className="text-xs">
                                Last updated: {new Date().toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
