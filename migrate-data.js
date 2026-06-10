// 1. Your new server URL
const SERVER_URL = 'http://mesh.dcs1.biz:9482';

// 2. Extract existing data from the laptop
const customers = JSON.parse(localStorage.getItem('customers') || '[]');
const activities = JSON.parse(localStorage.getItem('activities') || '[]');

console.log(`Found ${customers.length} customers and ${activities.length} activities. Starting migration to ${SERVER_URL}...`);

// 3. Migrate Customers
if (customers.length > 0) {
    fetch(`${SERVER_URL}/api/customers/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customers)
    })
    .then(res => res.json())
    .then(data => console.log('✅ Customers migrated successfully:', data))
    .catch(err => console.error('❌ Customer migration failed:', err));
}

// 4. Migrate Activities
if (activities.length > 0) {
    Promise.all(activities.map(activity => 
        fetch(`${SERVER_URL}/api/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activity)
        })
    ))
    .then(() => console.log(`✅ All ${activities.length} Activities migrated successfully.`))
    .catch(err => console.error('❌ Activity migration failed:', err));
}
