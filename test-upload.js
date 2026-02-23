const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        const filePath = '/Users/joaquinlopezcrespo/Downloads/registro-de-viajeros-2026-02-21.csv';
        const fileContent = fs.readFileSync(filePath);

        const formData = new FormData();
        // Use File/Blob for FormData
        const blob = new Blob([fileContent], { type: 'text/csv' });
        formData.append('file', blob, 'registro-de-viajeros-2026-02-21.csv');
        formData.append('communicationType', 'parte_viajeros');

        console.log('Sending CSV to /api/upload...');
        const uploadRes = await fetch('http://localhost:3003/api/upload', {
            method: 'POST',
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log('Upload Result:', JSON.stringify(uploadData, null, 2));

        if (!uploadData.success) {
            console.error('Upload failed!');
            return;
        }

        const jobId = uploadData.job.id;
        console.log(`\nSending job ${jobId} to /api/send...`);

        const sendRes = await fetch('http://localhost:3003/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
        });

        const sendData = await sendRes.json();
        console.log('Send Result:', JSON.stringify(sendData, null, 2));

    } catch (error) {
        console.error('Test error:', error);
    }
}

testUpload();
