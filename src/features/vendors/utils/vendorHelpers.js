export const GST_TYPES = ['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER', 'OVERSEAS'];

export const GST_STATE_MAP = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
    '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
    '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
    '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
    '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra',
    '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
    '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

export const EMPTY_VENDOR_FORM = {
    name: '', contactName: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    gstRegistrationType: '', gstNumber: '', panNumber: '', isActive: true,
};

export function vendorFromExisting(v) {
    return {
        name: v.name || '',
        contactName: v.contactName || '',
        phone: v.phone || '',
        email: v.email || '',
        address: v.address || '',
        city: v.city || '',
        state: v.state || '',
        pincode: v.pincode || '',
        gstRegistrationType: v.gstRegistrationType || '',
        gstNumber: v.gstNumber || '',
        panNumber: v.panNumber || '',
        isActive: v.isActive !== false,
    };
}

export function deriveStateFromGst(gst) {
    return GST_STATE_MAP[gst.slice(0, 2)] || null;
}
