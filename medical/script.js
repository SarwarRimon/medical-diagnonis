// Update selected symptom count
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('input[name="symptom"]:checked');
    const countEl = document.getElementById('selectedCount');
    const count = checkboxes.length;
    
    countEl.querySelector('span').textContent = `${count} symptom${count !== 1 ? 's' : ''} selected`;
    
    if (count > 0) {
        countEl.classList.add('has-selection');
    } else {
        countEl.classList.remove('has-selection');
    }
}

// Toggle symptom category dropdown
function toggleCategory(event) {
    const header = event.currentTarget;
    const category = header.closest('.symptom-category');
    
    // Close all other categories
    document.querySelectorAll('.symptom-category').forEach(cat => {
        if (cat !== category) {
            cat.classList.remove('active');
        }
    });
    
    // Toggle current category
    category.classList.toggle('active');
}

// Attach event listeners to checkboxes
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('input[name="symptom"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });
    
    // Attach click listeners to category headers
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
});

// Reset form
function resetForm() {
    const checkboxes = document.querySelectorAll('input[name="symptom"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Close all dropdowns
    document.querySelectorAll('.symptom-category').forEach(cat => {
        cat.classList.remove('active');
    });
    
    updateSelectedCount();
    
    // Reset UI
    document.getElementById("initialState").style.display = "flex";
    document.getElementById("dynamicContent").style.display = "none";
}

// Main diagnosis function
function runDiagnosis() {
    const btn = document.getElementById("diagnoseBtn");
    const initialState = document.getElementById("initialState");
    const dynamicContent = document.getElementById("dynamicContent");
    
    // Close all open dropdowns
    document.querySelectorAll('.symptom-category').forEach(cat => {
        cat.classList.remove('active');
    });
    
    // Gather selected symptoms
    const checkboxes = document.querySelectorAll('input[name="symptom"]:checked');
    const symptoms = Array.from(checkboxes).map(cb => cb.value);
    
    // Gather patient information
    const patientInfo = {
        name: document.getElementById('patientName').value || 'Not Provided',
        age: document.getElementById('patientAge').value || 'Not Provided',
        gender: document.getElementById('patientGender').value || 'Not Provided',
        email: document.getElementById('patientEmail').value || 'Not Provided',
        phone: document.getElementById('patientPhone').value || 'Not Provided'
    };
    
    // Validate
    if (symptoms.length === 0) {
        alert("Please select at least one symptom.");
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';
    initialState.style.display = "none";
    dynamicContent.style.display = "block";
    dynamicContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Analyzing symptoms against medical knowledge base...</p>
        </div>
    `;
    
    // Call backend API
    fetch("/diagnose", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ symptoms: symptoms })
    })
    .then(async r => {
        const responseText = await r.text();
        if (!r.ok) {
            try {
                const err = JSON.parse(responseText);
                throw new Error(err.details || err.error || `Server error: ${r.status}`);
            } catch (e) {
                throw new Error(`Server error: ${r.status} - ${responseText}`);
            }
        }
        return JSON.parse(responseText);
    })
    .then(data => {
        if (!data.results || data.results.length === 0) {
            renderNoResults();
        } else {
            renderResults(data.results, symptoms, patientInfo);
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze';
    })
    .catch(error => {
        console.error("Error:", error);
        renderError(error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze';
    });
}

function renderNoResults() {
    const container = document.getElementById("dynamicContent");
    container.innerHTML = `
        <div class="hero-text">
            <i class="fa-regular fa-face-meh"></i>
            <h2>No Conditions Matched</h2>
            <p>The selected symptoms don't strongly match any conditions in our database. This could mean the condition is not in our knowledge base, or you may need to select more symptoms.</p>
        </div>
    `;
}

function renderError(message) {
    const container = document.getElementById("dynamicContent");
    container.innerHTML = `
        <div class="hero-text error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h2>Connection Error</h2>
            <p>${message}</p>
            <p class="hint">Make sure the Prolog server is running on port 8080.</p>
        </div>
    `;
}

function renderResults(results, selectedSymptoms, patientInfo) {
    const container = document.getElementById("dynamicContent");
    
    // Disease metadata for display
    const diseaseInfo = {
        // Gastrointestinal
        'intestinal_cancer': {
            name: 'Intestinal Cancer',
            icon: 'fa-solid fa-ribbon',
            color: '#e74c3c',
            description: 'Cancer affecting the intestines, which can cause various digestive and systemic symptoms.',
            urgency: 'high'
        },
        'crohns_disease': {
            name: "Crohn's Disease",
            icon: 'fa-solid fa-bacteria',
            color: '#9b59b6',
            description: 'A chronic inflammatory bowel disease that affects the lining of the digestive tract.',
            urgency: 'medium'
        },
        'celiac_disease': {
            name: 'Celiac Disease',
            icon: 'fa-solid fa-wheat-awn',
            color: '#f39c12',
            description: 'An immune reaction to eating gluten, affecting the small intestine lining.',
            urgency: 'medium'
        },
        'intestinal_obstruction': {
            name: 'Intestinal Obstruction',
            icon: 'fa-solid fa-ban',
            color: '#e67e22',
            description: 'A blockage that prevents food or liquid from passing through the intestine.',
            urgency: 'high'
        },
        'gastritis': {
            name: 'Gastritis',
            icon: 'fa-solid fa-fire',
            color: '#e74c3c',
            description: 'Inflammation of the stomach lining causing pain, nausea, and digestive issues.',
            urgency: 'medium'
        },
        'peptic_ulcer': {
            name: 'Peptic Ulcer',
            icon: 'fa-solid fa-circle-dot',
            color: '#c0392b',
            description: 'Open sores that develop on the inside lining of the stomach or upper small intestine.',
            urgency: 'medium'
        },
        'irritable_bowel_syndrome': {
            name: 'Irritable Bowel Syndrome (IBS)',
            icon: 'fa-solid fa-tornado',
            color: '#8e44ad',
            description: 'A common disorder affecting the large intestine causing cramping, pain, and bowel changes.',
            urgency: 'low'
        },
        'gastroesophageal_reflux': {
            name: 'GERD (Acid Reflux)',
            icon: 'fa-solid fa-arrow-up',
            color: '#e67e22',
            description: 'A digestive disease where stomach acid frequently flows back into the esophagus.',
            urgency: 'low'
        },
        // Liver Diseases
        'hepatitis': {
            name: 'Hepatitis',
            icon: 'fa-solid fa-virus',
            color: '#f1c40f',
            description: 'Inflammation of the liver, often caused by viral infection or toxins.',
            urgency: 'high'
        },
        'cirrhosis': {
            name: 'Cirrhosis',
            icon: 'fa-solid fa-disease',
            color: '#d35400',
            description: 'Late-stage liver scarring caused by many forms of liver diseases and conditions.',
            urgency: 'high'
        },
        'fatty_liver_disease': {
            name: 'Fatty Liver Disease',
            icon: 'fa-solid fa-droplet',
            color: '#f39c12',
            description: 'A condition where excess fat builds up in the liver cells.',
            urgency: 'medium'
        },
        // Infectious Diseases
        'common_cold': {
            name: 'Common Cold',
            icon: 'fa-solid fa-head-side-cough',
            color: '#3498db',
            description: 'A viral infection of the nose and throat, usually harmless but uncomfortable.',
            urgency: 'low'
        },
        'influenza': {
            name: 'Influenza (Flu)',
            icon: 'fa-solid fa-virus',
            color: '#2980b9',
            description: 'A contagious respiratory illness caused by influenza viruses.',
            urgency: 'medium'
        },
        'food_poisoning': {
            name: 'Food Poisoning',
            icon: 'fa-solid fa-utensils',
            color: '#27ae60',
            description: 'Illness caused by eating contaminated food containing bacteria, viruses, or parasites.',
            urgency: 'medium'
        },
        'gastroenteritis': {
            name: 'Gastroenteritis (Stomach Flu)',
            icon: 'fa-solid fa-bacterium',
            color: '#16a085',
            description: 'Intestinal infection causing diarrhea, cramps, nausea, vomiting, and fever.',
            urgency: 'medium'
        },
        'typhoid_fever': {
            name: 'Typhoid Fever',
            icon: 'fa-solid fa-temperature-high',
            color: '#c0392b',
            description: 'A bacterial infection that can spread through contaminated food and water.',
            urgency: 'high'
        },
        'malaria': {
            name: 'Malaria',
            icon: 'fa-solid fa-mosquito',
            color: '#8e44ad',
            description: 'A serious disease caused by parasites transmitted through mosquito bites.',
            urgency: 'high'
        },
        // Respiratory
        'pneumonia': {
            name: 'Pneumonia',
            icon: 'fa-solid fa-lungs-virus',
            color: '#e74c3c',
            description: 'An infection that inflames the air sacs in one or both lungs.',
            urgency: 'high'
        },
        'bronchitis': {
            name: 'Bronchitis',
            icon: 'fa-solid fa-lungs',
            color: '#3498db',
            description: 'Inflammation of the bronchial tubes which carry air to and from the lungs.',
            urgency: 'medium'
        },
        'asthma': {
            name: 'Asthma',
            icon: 'fa-solid fa-wind',
            color: '#9b59b6',
            description: 'A condition where airways narrow and swell, producing extra mucus.',
            urgency: 'medium'
        },
        // Metabolic
        'diabetes': {
            name: 'Diabetes',
            icon: 'fa-solid fa-droplet',
            color: '#2980b9',
            description: 'A disease that occurs when blood glucose is too high.',
            urgency: 'medium'
        },
        'anemia': {
            name: 'Anemia',
            icon: 'fa-solid fa-heart-pulse',
            color: '#e74c3c',
            description: 'A condition where you lack enough healthy red blood cells to carry oxygen.',
            urgency: 'medium'
        },
        // Kidney
        'kidney_infection': {
            name: 'Kidney Infection',
            icon: 'fa-solid fa-kidneys',
            color: '#e67e22',
            description: 'A type of urinary tract infection that generally begins in the bladder.',
            urgency: 'high'
        },
        'kidney_stones': {
            name: 'Kidney Stones',
            icon: 'fa-solid fa-gem',
            color: '#f39c12',
            description: 'Hard deposits made of minerals and salts that form inside the kidneys.',
            urgency: 'high'
        },
        // Autoimmune
        'rheumatoid_arthritis': {
            name: 'Rheumatoid Arthritis',
            icon: 'fa-solid fa-bone',
            color: '#9b59b6',
            description: 'An autoimmune disorder that primarily affects joints causing inflammation.',
            urgency: 'medium'
        },
        'lupus': {
            name: 'Lupus',
            icon: 'fa-solid fa-shield-virus',
            color: '#8e44ad',
            description: 'A systemic autoimmune disease where the immune system attacks healthy tissue.',
            urgency: 'medium'
        },
        // Neurological
        'migraine': {
            name: 'Migraine',
            icon: 'fa-solid fa-brain',
            color: '#e74c3c',
            description: 'A headache of varying intensity, often with nausea and sensitivity to light.',
            urgency: 'low'
        },
        'meningitis': {
            name: 'Meningitis',
            icon: 'fa-solid fa-head-side-virus',
            color: '#c0392b',
            description: 'Inflammation of the membranes surrounding the brain and spinal cord.',
            urgency: 'high'
        }
    };
    
    // Sort results by confidence (highest to lowest)
    results.sort((a, b) => {
        return b.confidence - a.confidence;
    });
    
    let html = `
        <div class="results-container">
            <!-- PATIENT INFORMATION CARD -->
            <div class="patient-info-card">
                <h3><i class="fa-solid fa-user-doctor"></i> Patient Information</h3>
                <div class="patient-details">
                    <div class="patient-detail">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${patientInfo.name}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="detail-label">Age:</span>
                        <span class="detail-value">${patientInfo.age}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="detail-label">Gender:</span>
                        <span class="detail-value">${patientInfo.gender}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${patientInfo.email}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${patientInfo.phone}</span>
                    </div>
                </div>
            </div>

            <div class="results-summary">
                <h3>Analysis Results</h3>
                <p>Found <strong>${results.length}</strong> potential condition${results.length > 1 ? 's' : ''} based on your <strong>${selectedSymptoms.length}</strong> symptom${selectedSymptoms.length > 1 ? 's' : ''}</p>
                <div class="matched-symptoms">
                    ${selectedSymptoms.map(s => `<span class="symptom-badge">${formatSymptomName(s)}</span>`).join('')}
                </div>
            </div>
    `;
    
    results.forEach((result, index) => {
        const disease = result.disease;
        const confidence = result.confidence;
        const info = diseaseInfo[disease] || {
            name: formatDiseaseName(disease),
            icon: 'fa-solid fa-virus',
            color: '#3498db',
            description: 'A medical condition detected by the expert system.',
            urgency: 'low'
        };
        
        // Determine confidence level and urgency based on Match Confidence %
        let confidenceClass = 'low';
        let confidenceLabel = 'Low Match';
        let urgencyLevel = 'low';
        if (confidence >= 70) {
            confidenceClass = 'high';
            confidenceLabel = 'High Match';
            urgencyLevel = 'high';
        } else if (confidence >= 50) {
            confidenceClass = 'medium';
            confidenceLabel = 'Moderate Match';
            urgencyLevel = 'medium';
        }
        
        html += `
            <div class="condition-card" style="border-left-color: ${info.color}">
                <div class="card-rank">
                    <span class="rank-badge">#${index + 1}</span>
                </div>
                <div class="condition-card-header">
                    <div class="condition-icon" style="background: ${info.color}20; color: ${info.color}">
                        <i class="${info.icon}"></i>
                    </div>
                    <div class="condition-title">
                        <h3>${info.name}</h3>
                        ${urgencyLevel === 'high' ? `<span class="urgency-badge urgency-${urgencyLevel}"><i class="fa-solid fa-exclamation-triangle"></i> High Priority</span>` : ''}
                    </div>
                </div>
                
                <p class="condition-description">${info.description}</p>
                
                <div class="condition-details">
                    <div class="detail-item">
                        <div class="detail-item-label">Match Confidence</div>
                        <div class="detail-item-value">
                            <div class="symptom-match-rate">
                                <div class="match-bar">
                                    <div class="match-fill" style="width: ${confidence}%"></div>
                                </div>
                                <span class="match-percentage">${confidence.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-label">Urgency Level</div>
                        <div class="detail-item-value">
                            <span class="urgency-badge urgency-${urgencyLevel}">${urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}</span>
                        </div>
                    </div>
                </div>
                
                
                <div class="button-container">
                    <button class="btn-view-details" data-disease="${disease}">
                        <i class="fa-solid fa-magnifying-glass"></i> View Details
                    </button>
                </div>
                
                <div class="button-container">
                    <button class="btn-tests-card" onclick="showRecommendedTests('${disease}')">
                        <i class="fa-solid fa-flask-vial"></i> Recommended Tests
                    </button>
                </div>
                
                <div class="button-container">
                    <button class="btn-treatment-card" onclick="showTreatmentAdvice('${disease}')">
                        <i class="fa-solid fa-capsules"></i> Treatment & Care
                    </button>
                </div>
                
                <div class="recommendations">
                    <div class="recommendations-label">Recommendation</div>
                    <div class="recommendations-text">
                        Consult a healthcare professional for proper diagnosis and treatment.
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add click listeners to all View Details buttons
    setTimeout(() => {
        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const disease = this.dataset.disease;
                const checkboxes = document.querySelectorAll('input[name="symptom"]:checked');
                const selectedSymptoms = Array.from(checkboxes).map(cb => cb.value);
                showDiseaseDetails(disease, selectedSymptoms);
            });
        });
    }, 0);
}

// Handle View Details button click
function handleViewDetailsClick(event, disease) {
    event.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="symptom"]:checked');
    const selectedSymptoms = Array.from(checkboxes).map(cb => cb.value);
    showDiseaseDetails(disease, selectedSymptoms);
}

// Helper functions
function formatSymptomName(symptom) {
    return symptom
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDiseaseName(disease) {
    return disease
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Show disease details modal
function showDiseaseDetails(disease, selectedSymptoms) {
    // selectedSymptoms is already an array from the onclick
    fetch("/disease_details", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ 
            disease: disease,
            symptoms: selectedSymptoms 
        })
    })
    .then(async r => {
        const responseText = await r.text();
        if (!r.ok) {
            throw new Error(`Server error: ${r.status}`);
        }
        return JSON.parse(responseText);
    })
    .then(data => {
        renderDiseaseDetailsModal(disease, selectedSymptoms, data);
    })
    .catch(error => {
        console.error("Error fetching disease details:", error);
        alert("Failed to load disease details");
    });
}

// Helper function to get recommended tests by disease
function getRecommendedTests(disease) {
    const testRecommendations = {
        'intestinal_cancer': {
            lab: ['Complete Blood Count (CBC)', 'Carcinoembryonic Antigen (CEA)', 'Liver Function Tests'],
            imaging: ['CT Colonoscopy', 'MRI Abdomen', 'Chest X-ray']
        },
        'crohns_disease': {
            lab: ['Inflammatory Markers (ESR, CRP)', 'Fecal Calprotectin', 'Complete Blood Count'],
            imaging: ['CT Enterography', 'MR Enterography', 'Capsule Endoscopy']
        },
        'celiac_disease': {
            lab: ['Tissue Transglutaminase (tTG-IgA)', 'Total IgA', 'Endomysial Antibody'],
            imaging: ['Upper Endoscopy with Biopsy', 'Abdominal Ultrasound']
        },
        'intestinal_obstruction': {
            lab: ['Complete Blood Count', 'Electrolytes', 'Kidney Function Tests'],
            imaging: ['Abdominal X-ray', 'CT Abdomen', 'Ultrasound Abdomen']
        },
        'gastritis': {
            lab: ['Complete Blood Count', 'H. pylori Test', 'Gastric Biopsy'],
            imaging: ['Upper Endoscopy', 'Abdominal Ultrasound']
        },
        'peptic_ulcer': {
            lab: ['H. pylori Test', 'Complete Blood Count', 'Stool Antigen Test'],
            imaging: ['Upper Endoscopy', 'Upper GI Series']
        },
        'irritable_bowel_syndrome': {
            lab: ['Complete Blood Count', 'Electrolytes', 'Fecal Calprotectin'],
            imaging: ['Colonoscopy', 'Abdominal Ultrasound', 'CT Abdomen']
        },
        'gastroesophageal_reflux': {
            lab: ['Complete Blood Count', 'H. pylori Test'],
            imaging: ['Upper Endoscopy', 'Barium Swallow', '24-hour pH Monitoring']
        },
        'hepatitis': {
            lab: ['Liver Function Tests', 'Viral Hepatitis Panel', 'Liver Biopsy'],
            imaging: ['Abdominal Ultrasound', 'CT Abdomen', 'Elastography']
        },
        'cirrhosis': {
            lab: ['Liver Function Tests', 'Coagulation Profile', 'Albumin Level'],
            imaging: ['Abdominal Ultrasound', 'CT/MRI Abdomen', 'Upper Endoscopy']
        },
        'fatty_liver_disease': {
            lab: ['Liver Function Tests', 'Lipid Panel', 'Metabolic Panel'],
            imaging: ['Abdominal Ultrasound', 'Elastography', 'CT Abdomen']
        },
        'common_cold': {
            lab: ['Throat Swab (Optional)', 'Complete Blood Count'],
            imaging: ['Chest X-ray (if needed)']
        },
        'influenza': {
            lab: ['Rapid Influenza Test', 'PCR Test', 'Complete Blood Count'],
            imaging: ['Chest X-ray (if pneumonia suspected)']
        },
        'food_poisoning': {
            lab: ['Stool Culture', 'Complete Blood Count', 'Electrolytes'],
            imaging: ['Abdominal X-ray (if needed)']
        },
        'gastroenteritis': {
            lab: ['Stool Culture', 'Complete Blood Count', 'Electrolytes'],
            imaging: ['Abdominal Ultrasound (if needed)']
        },
        'typhoid_fever': {
            lab: ['Blood Culture', 'Widal Test', 'Typhoid PCR', 'Complete Blood Count'],
            imaging: ['Abdominal Ultrasound', 'Chest X-ray']
        },
        'malaria': {
            lab: ['Thick and Thin Blood Smear', 'Malaria Rapid Test', 'PCR'],
            imaging: ['Chest X-ray (if needed)']
        },
        'pneumonia': {
            lab: ['Complete Blood Count', 'Blood Culture', 'Sputum Culture'],
            imaging: ['Chest X-ray', 'CT Chest', 'Pulse Oximetry']
        },
        'bronchitis': {
            lab: ['Complete Blood Count', 'Sputum Culture (if bacterial)'],
            imaging: ['Chest X-ray', 'Peak Flow Test']
        },
        'asthma': {
            lab: ['Complete Blood Count', 'IgE Levels', 'Allergy Testing'],
            imaging: ['Chest X-ray', 'Spirometry', 'Peak Flow Measurement']
        },
        'diabetes': {
            lab: ['Fasting Blood Glucose', 'HbA1c', 'Lipid Panel', 'Kidney Function'],
            imaging: ['Eye Examination', 'Foot Examination', 'EKG']
        },
        'anemia': {
            lab: ['Complete Blood Count', 'Iron Studies', 'Vitamin B12 Level', 'Folate Level'],
            imaging: ['Peripheral Blood Smear', 'Bone Marrow Biopsy (if needed)']
        },
        'kidney_infection': {
            lab: ['Urinalysis', 'Urine Culture', 'Complete Blood Count', 'Kidney Function'],
            imaging: ['Abdominal Ultrasound', 'CT Abdomen', 'Renal Scan']
        },
        'kidney_stones': {
            lab: ['Urinalysis', 'Metabolic Panel', 'Uric Acid'],
            imaging: ['CT Abdomen (Non-contrast)', 'Abdominal X-ray', 'Ultrasound']
        },
        'rheumatoid_arthritis': {
            lab: ['Rheumatoid Factor (RF)', 'Anti-CCP Antibody', 'ESR', 'CRP'],
            imaging: ['X-ray Hands', 'MRI Joints', 'Ultrasound Joints']
        },
        'lupus': {
            lab: ['ANA Test', 'Anti-dsDNA', 'Complement Levels', 'Complete Blood Count'],
            imaging: ['Chest X-ray', 'Kidney Biopsy (if needed)', 'Echocardiography']
        },
        'migraine': {
            lab: ['Complete Blood Count', 'Metabolic Panel'],
            imaging: ['MRI Brain', 'CT Brain', 'EEG (if needed)']
        },
        'meningitis': {
            lab: ['Blood Culture', 'Cerebrospinal Fluid (CSF) Analysis', 'Complete Blood Count'],
            imaging: ['Lumbar Puncture', 'CT/MRI Brain', 'Chest X-ray']
        }
    };
    
    return testRecommendations[disease] || {
        lab: ['Complete Blood Count', 'Metabolic Panel'],
        imaging: ['Physical Examination', 'Relevant Imaging based on symptoms']
    };
}

// Helper function to get treatment and home-care advice by disease
function getTreatmentAdvice(disease) {
    const treatmentGuide = {
        'intestinal_cancer': {
            treatment: ['Consult an oncologist immediately', 'Surgery may be required', 'Chemotherapy or radiation therapy may be recommended', 'Follow-up appointments are crucial'],
            homecare: ['Maintain balanced nutrition', 'Stay hydrated', 'Manage side effects with prescribed medications', 'Get adequate rest and sleep', 'Avoid smoking and alcohol', 'Consider support groups']
        },
        'crohns_disease': {
            treatment: ['Consult a gastroenterologist', 'Anti-inflammatory medications', 'Immunosuppressants may be needed', 'Biologic therapies available', 'Surgery if complications occur'],
            homecare: ['Follow a balanced diet', 'Avoid trigger foods (spicy, fatty)', 'Stay hydrated', 'Reduce stress through yoga/meditation', 'Take prescribed medications regularly', 'Keep a food diary']
        },
        'celiac_disease': {
            treatment: ['Confirm diagnosis with biopsy', 'Strict gluten-free diet', 'Nutritional supplements if needed', 'Regular follow-up with dietitian'],
            homecare: ['Eliminate gluten from diet', 'Read food labels carefully', 'Prevent cross-contamination', 'Take vitamin supplements as advised', 'Join support groups', 'Learn about gluten-free alternatives']
        },
        'intestinal_obstruction': {
            treatment: ['Immediate medical evaluation required', 'Nasogastric tube decompression', 'IV fluids and electrolyte correction', 'Surgery may be necessary', 'Treat underlying cause'],
            homecare: ['Nothing by mouth (NPO) initially', 'Follow post-operative care instructions', 'Take medications as prescribed', 'Monitor for complications', 'Gradually resume diet', 'Report any worsening symptoms']
        },
        'gastritis': {
            treatment: ['Antacids for symptom relief', 'Proton pump inhibitors', 'H. pylori eradication if positive', 'Avoid NSAIDs', 'Dietary modifications'],
            homecare: ['Eat small, frequent meals', 'Avoid spicy and acidic foods', 'Reduce alcohol consumption', 'Stop smoking', 'Manage stress', 'Take medications before meals']
        },
        'peptic_ulcer': {
            treatment: ['Proton pump inhibitors', 'H2 receptor blockers', 'H. pylori treatment if positive', 'Avoid NSAIDs', 'Antibiotics if infected'],
            homecare: ['Eat soft, bland foods', 'Avoid caffeine and alcohol', 'Reduce stress', 'Stop smoking', 'Elevate head while sleeping', 'Take medications as prescribed']
        },
        'irritable_bowel_syndrome': {
            treatment: ['Antispasmodics for cramps', 'Anti-diarrheal or laxatives', 'Dietary fiber supplements', 'Stress management therapy', 'Probiotics may help'],
            homecare: ['Identify and avoid trigger foods', 'Increase fiber intake gradually', 'Stay hydrated', 'Exercise regularly', 'Practice stress reduction', 'Maintain regular meal times']
        },
        'gastroesophageal_reflux': {
            treatment: ['Antacids for quick relief', 'H2 receptor blockers', 'Proton pump inhibitors', 'Prokinetic agents', 'Lifestyle modifications'],
            homecare: ['Sleep with head elevated', 'Avoid late-night meals', 'Reduce portion sizes', 'Avoid trigger foods', 'Maintain healthy weight', 'Don\'t lie down after eating']
        },
        'hepatitis': {
            treatment: ['Antiviral medications', 'Liver function monitoring', 'Vaccination (Hep A & B)', 'Avoid hepatotoxic drugs', 'Regular medical follow-up'],
            homecare: ['Rest adequately', 'Stay hydrated', 'Eat nutritious foods', 'Avoid alcohol completely', 'Don\'t share personal items', 'Prevent transmission to others']
        },
        'cirrhosis': {
            treatment: ['Treat underlying cause', 'Diuretics for fluid buildup', 'Beta-blockers for varices', 'Liver transplant evaluation', 'Regular monitoring'],
            homecare: ['Strict fluid and salt restriction', 'Avoid alcohol completely', 'Take medications religiously', 'Eat healthy, low-salt meals', 'Monitor for complications', 'Keep all appointments']
        },
        'fatty_liver_disease': {
            treatment: ['Weight loss program', 'Manage diabetes and cholesterol', 'Avoid hepatotoxic substances', 'Monitor liver function', 'Vitamin E supplements (consult doctor)'],
            homecare: ['Reduce calorie intake', 'Exercise regularly', 'Avoid alcohol', 'Eat balanced, healthy diet', 'Manage stress', 'Regular check-ups']
        },
        'common_cold': {
            treatment: ['Rest and fluids', 'Over-the-counter decongestants', 'Cough suppressants if needed', 'Saline nasal drops', 'Symptom management'],
            homecare: ['Get plenty of rest', 'Stay hydrated with warm fluids', 'Use honey for cough relief', 'Gargle with salt water', 'Use humidifier', 'Avoid smoking and secondhand smoke']
        },
        'influenza': {
            treatment: ['Antiviral medications (oseltamivir)', 'Pain relievers and fever reducers', 'Rest and fluids', 'Monitor for complications'],
            homecare: ['Rest for several days', 'Stay hydrated', 'Avoid contact with others', 'Use saline nasal spray', 'Apply warm compresses', 'Take over-the-counter pain relievers']
        },
        'food_poisoning': {
            treatment: ['Fluid and electrolyte replacement', 'Anti-nausea medications if needed', 'Antibiotics if bacterial', 'Monitor hydration status'],
            homecare: ['Rest and avoid food initially', 'Sip clear fluids slowly', 'Eat bland foods when ready', 'Stay hydrated with electrolyte solutions', 'Avoid dairy and fatty foods', 'Monitor symptoms']
        },
        'gastroenteritis': {
            treatment: ['Oral rehydration solution', 'Anti-diarrheal if no fever', 'Antiemetics for vomiting', 'Antibiotics if bacterial'],
            homecare: ['Drink clear fluids frequently', 'Eat bland foods', 'Avoid dairy and spicy food', 'Use ORS (oral rehydration salts)', 'Rest adequately', 'Practice good hygiene']
        },
        'typhoid_fever': {
            treatment: ['Appropriate antibiotics', 'Fever management', 'IV fluids if severe', 'Hospitalization often needed', 'Monitor for complications'],
            homecare: ['Complete antibiotic course', 'Bed rest during fever', 'Stay hydrated', 'Eat nutritious soft foods', 'Monitor temperature', 'Report worsening symptoms']
        },
        'malaria': {
            treatment: ['Antimalarial drugs based on type', 'Fever management', 'Parenteral therapy if severe', 'Close monitoring required'],
            homecare: ['Take antimalarials as prescribed', 'Rest adequately', 'Stay hydrated', 'Manage fever with paracetamol', 'Eat nutritious meals', 'Follow-up blood tests']
        },
        'pneumonia': {
            treatment: ['Antibiotics (based on type)', 'Oxygen therapy if needed', 'Fever and pain management', 'Hospitalization for severe cases'],
            homecare: ['Complete antibiotic course', 'Rest adequately', 'Stay hydrated', 'Use humidifier', 'Avoid smoking', 'Report worsening symptoms']
        },
        'bronchitis': {
            treatment: ['Cough suppressants', 'Bronchodilators if needed', 'Antibiotics if bacterial', 'Expectorants for mucus'],
            homecare: ['Use humidifier', 'Drink plenty of fluids', 'Rest adequately', 'Avoid irritants and smoke', 'Use saline nasal spray', 'Eat warm soups']
        },
        'asthma': {
            treatment: ['Inhalers (quick relief and maintenance)', 'Asthma action plan', 'Allergen avoidance', 'Regular monitoring', 'Avoid triggers'],
            homecare: ['Keep rescue inhaler accessible', 'Use maintenance inhaler daily', 'Identify and avoid triggers', 'Monitor peak flow', 'Regular exercise', 'Keep appointment schedule']
        },
        'diabetes': {
            treatment: ['Blood sugar monitoring', 'Oral medications or insulin', 'Dietary management', 'Regular exercise', 'Complications screening'],
            homecare: ['Monitor blood sugar regularly', 'Follow diabetic diet', 'Exercise 30 minutes daily', 'Maintain healthy weight', 'Foot care daily', 'Take medications on schedule']
        },
        'anemia': {
            treatment: ['Iron supplements or transfusions', 'Treat underlying cause', 'Vitamin B12 or folate supplementation', 'Monitor hemoglobin levels'],
            homecare: ['Take iron supplements with vitamin C', 'Eat iron-rich foods', 'Avoid tea with meals', 'Stay hydrated', 'Rest adequately', 'Take supplements as prescribed']
        },
        'kidney_infection': {
            treatment: ['Antibiotics', 'Pain management', 'Fever control', 'IV fluids if severe', 'Follow-up imaging'],
            homecare: ['Drink plenty of water', 'Take antibiotics completely', 'Use heating pad for pain', 'Rest adequately', 'Monitor symptoms', 'Empty bladder frequently']
        },
        'kidney_stones': {
            treatment: ['Pain management', 'Increased fluid intake', 'Alpha-blockers', 'Extracorporeal shock wave lithotripsy (ESWL)', 'Surgery if necessary'],
            homecare: ['Drink 3-4 liters of water daily', 'Take pain relievers as needed', 'Strain urine to catch stone', 'Avoid dehydration', 'Modify diet based on stone type', 'Follow-up imaging']
        },
        'rheumatoid_arthritis': {
            treatment: ['DMARDs (disease-modifying drugs)', 'Biologics', 'NSAIDs for inflammation', 'Physical therapy', 'Regular monitoring'],
            homecare: ['Take medications as prescribed', 'Regular gentle exercise', 'Apply heat/cold therapy', 'Maintain healthy weight', 'Manage stress', 'Joint protection techniques']
        },
        'lupus': {
            treatment: ['Hydroxychloroquine', 'Corticosteroids', 'NSAIDs', 'Immunosuppressants', 'Regular monitoring'],
            homecare: ['Take medications consistently', 'Avoid sun exposure', 'Use sunscreen (SPF 50+)', 'Manage fatigue with rest', 'Regular exercise', 'Manage stress']
        },
        'migraine': {
            treatment: ['Triptans for acute attacks', 'Preventive medications', 'Identify and avoid triggers', 'Lifestyle modifications'],
            homecare: ['Keep headache diary', 'Rest in dark, quiet room', 'Apply cold/warm compress', 'Avoid trigger foods', 'Stay hydrated', 'Regular sleep schedule']
        },
        'meningitis': {
            treatment: ['Immediate hospitalization', 'Antibiotics or antivirals', 'Supportive care', 'Anticonvulsants if needed', 'Close contacts prophylaxis'],
            homecare: ['Hospitalization required', 'Strict isolation precautions', 'Fever management', 'Comfort measures', 'Family support', 'Vaccination after recovery']
        }
    };
    
    return treatmentGuide[disease] || {
        treatment: ['Consult a healthcare professional', 'Get proper diagnosis', 'Follow medical advice', 'Regular monitoring'],
        homecare: ['Rest adequately', 'Stay hydrated', 'Take prescribed medications', 'Maintain healthy lifestyle', 'Follow-up appointments']
    };
}

// Show recommended tests
function showRecommendedTests(disease) {
    const testsData = getRecommendedTests(disease);
    const diseaseNames = {
        'intestinal_cancer': 'Intestinal Cancer',
        'crohns_disease': "Crohn's Disease",
        'celiac_disease': 'Celiac Disease',
        'intestinal_obstruction': 'Intestinal Obstruction',
        'gastritis': 'Gastritis',
        'peptic_ulcer': 'Peptic Ulcer',
        'irritable_bowel_syndrome': 'Irritable Bowel Syndrome (IBS)',
        'gastroesophageal_reflux': 'GERD (Acid Reflux)',
        'hepatitis': 'Hepatitis',
        'cirrhosis': 'Cirrhosis',
        'fatty_liver_disease': 'Fatty Liver Disease',
        'common_cold': 'Common Cold',
        'influenza': 'Influenza (Flu)',
        'food_poisoning': 'Food Poisoning',
        'gastroenteritis': 'Gastroenteritis (Stomach Flu)',
        'typhoid_fever': 'Typhoid Fever',
        'malaria': 'Malaria',
        'pneumonia': 'Pneumonia',
        'bronchitis': 'Bronchitis',
        'asthma': 'Asthma',
        'diabetes': 'Diabetes',
        'anemia': 'Anemia',
        'kidney_infection': 'Kidney Infection',
        'kidney_stones': 'Kidney Stones',
        'rheumatoid_arthritis': 'Rheumatoid Arthritis',
        'lupus': 'Lupus',
        'migraine': 'Migraine',
        'meningitis': 'Meningitis'
    };
    
    const diseaseName = diseaseNames[disease] || formatDiseaseName(disease);
    
    const testsModal = document.createElement('div');
    testsModal.className = 'modal-overlay';
    testsModal.id = 'testsModal';
    
    testsModal.innerHTML = `
        <div class="modal-content tests-modal">
            <div class="modal-header">
                <h2>Recommended Tests: ${diseaseName}</h2>
                <button class="modal-close" onclick="document.getElementById('testsModal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="modal-body tests-body">
                <!-- Lab Tests Section -->
                <div class="tests-section">
                    <div class="tests-section-header">
                        <i class="fa-solid fa-flask-vial"></i>
                        <h3>Laboratory Tests</h3>
                    </div>
                    <ul class="tests-section-list">
                        ${testsData.lab.map(test => `
                            <li class="test-section-item">
                                <span class="test-section-icon">🔬</span>
                                <span>${test}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Imaging Tests Section -->
                <div class="tests-section">
                    <div class="tests-section-header">
                        <i class="fa-solid fa-stethoscope"></i>
                        <h3>Imaging & Procedures</h3>
                    </div>
                    <ul class="tests-section-list">
                        ${testsData.imaging.map(test => `
                            <li class="test-section-item">
                                <span class="test-section-icon">🖼️</span>
                                <span>${test}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="tests-note">
                    <i class="fa-solid fa-info-circle"></i>
                    <p><strong>Note:</strong> These tests are recommendations based on the suspected condition. Your healthcare provider will determine which tests are actually needed based on your specific situation.</p>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-primary" onclick="document.getElementById('testsModal').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(testsModal);
    
    // Close modal when clicking outside
    testsModal.addEventListener('click', (e) => {
        if (e.target === testsModal) {
            testsModal.remove();
        }
    });
}

// Show treatment and home-care advice
function showTreatmentAdvice(disease) {
    const treatmentData = getTreatmentAdvice(disease);
    const diseaseNames = {
        'intestinal_cancer': 'Intestinal Cancer',
        'crohns_disease': "Crohn's Disease",
        'celiac_disease': 'Celiac Disease',
        'intestinal_obstruction': 'Intestinal Obstruction',
        'gastritis': 'Gastritis',
        'peptic_ulcer': 'Peptic Ulcer',
        'irritable_bowel_syndrome': 'Irritable Bowel Syndrome (IBS)',
        'gastroesophageal_reflux': 'GERD (Acid Reflux)',
        'hepatitis': 'Hepatitis',
        'cirrhosis': 'Cirrhosis',
        'fatty_liver_disease': 'Fatty Liver Disease',
        'common_cold': 'Common Cold',
        'influenza': 'Influenza (Flu)',
        'food_poisoning': 'Food Poisoning',
        'gastroenteritis': 'Gastroenteritis (Stomach Flu)',
        'typhoid_fever': 'Typhoid Fever',
        'malaria': 'Malaria',
        'pneumonia': 'Pneumonia',
        'bronchitis': 'Bronchitis',
        'asthma': 'Asthma',
        'diabetes': 'Diabetes',
        'anemia': 'Anemia',
        'kidney_infection': 'Kidney Infection',
        'kidney_stones': 'Kidney Stones',
        'rheumatoid_arthritis': 'Rheumatoid Arthritis',
        'lupus': 'Lupus',
        'migraine': 'Migraine',
        'meningitis': 'Meningitis'
    };
    
    const diseaseName = diseaseNames[disease] || formatDiseaseName(disease);
    
    const treatmentModal = document.createElement('div');
    treatmentModal.className = 'modal-overlay';
    treatmentModal.id = 'treatmentModal';
    
    treatmentModal.innerHTML = `
        <div class="modal-content treatment-modal">
            <div class="modal-header">
                <h2>Treatment & Home-Care Advice: ${diseaseName}</h2>
                <button class="modal-close" onclick="document.getElementById('treatmentModal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="modal-body treatment-body">
                <div class="treatment-warning">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span><strong>Disclaimer:</strong> This information is for educational purposes only. Always consult with a qualified healthcare professional before starting any treatment.</span>
                </div>
                
                <!-- Medical Treatment Section -->
                <div class="treatment-section">
                    <div class="treatment-section-header">
                        <i class="fa-solid fa-hospital"></i>
                        <h3>Medical Treatment Options</h3>
                    </div>
                    <ul class="treatment-list">
                        ${treatmentData.treatment.map(item => `
                            <li class="treatment-item">
                                <span class="treatment-icon">💊</span>
                                <span>${item}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Home Care Section -->
                <div class="treatment-section">
                    <div class="treatment-section-header">
                        <i class="fa-solid fa-home"></i>
                        <h3>Home-Care Recommendations (Safe Mode)</h3>
                    </div>
                    <ul class="treatment-list">
                        ${treatmentData.homecare.map(item => `
                            <li class="treatment-item">
                                <span class="treatment-icon">🏥</span>
                                <span>${item}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="treatment-note">
                    <i class="fa-solid fa-info-circle"></i>
                    <p><strong>Important:</strong> Seek immediate medical attention if you experience severe symptoms or complications. Do not rely solely on home remedies for serious conditions.</p>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-primary" onclick="document.getElementById('treatmentModal').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(treatmentModal);
    
    // Close modal when clicking outside
    treatmentModal.addEventListener('click', (e) => {
        if (e.target === treatmentModal) {
            treatmentModal.remove();
        }
    });
}

// Render disease details modal
function renderDiseaseDetailsModal(disease, selectedSymptoms, data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'detailsModal';
    
    const matchedSymptoms = data.matched_symptoms || [];
    const missingSymptoms = data.missing_symptoms || [];
    const contradictingSymptoms = data.contradicting_symptoms || [];
    
    const diseaseInfo = {
        'intestinal_cancer': { name: 'Intestinal Cancer', color: '#e74c3c' },
        'crohns_disease': { name: "Crohn's Disease", color: '#9b59b6' },
        'celiac_disease': { name: 'Celiac Disease', color: '#f39c12' },
        'intestinal_obstruction': { name: 'Intestinal Obstruction', color: '#e67e22' },
        'gastritis': { name: 'Gastritis', color: '#e74c3c' },
        'peptic_ulcer': { name: 'Peptic Ulcer', color: '#c0392b' },
        'irritable_bowel_syndrome': { name: 'Irritable Bowel Syndrome (IBS)', color: '#8e44ad' },
        'gastroesophageal_reflux': { name: 'GERD (Acid Reflux)', color: '#e67e22' },
        'hepatitis': { name: 'Hepatitis', color: '#f1c40f' },
        'cirrhosis': { name: 'Cirrhosis', color: '#d35400' },
        'fatty_liver_disease': { name: 'Fatty Liver Disease', color: '#f39c12' },
        'common_cold': { name: 'Common Cold', color: '#3498db' },
        'influenza': { name: 'Influenza (Flu)', color: '#2980b9' },
        'food_poisoning': { name: 'Food Poisoning', color: '#27ae60' },
        'gastroenteritis': { name: 'Gastroenteritis (Stomach Flu)', color: '#16a085' },
        'typhoid_fever': { name: 'Typhoid Fever', color: '#c0392b' },
        'malaria': { name: 'Malaria', color: '#8e44ad' },
        'pneumonia': { name: 'Pneumonia', color: '#e74c3c' },
        'bronchitis': { name: 'Bronchitis', color: '#3498db' },
        'asthma': { name: 'Asthma', color: '#9b59b6' },
        'diabetes': { name: 'Diabetes', color: '#2980b9' },
        'anemia': { name: 'Anemia', color: '#e74c3c' },
        'kidney_infection': { name: 'Kidney Infection', color: '#e67e22' },
        'kidney_stones': { name: 'Kidney Stones', color: '#f39c12' },
        'rheumatoid_arthritis': { name: 'Rheumatoid Arthritis', color: '#9b59b6' },
        'lupus': { name: 'Lupus', color: '#8e44ad' },
        'migraine': { name: 'Migraine', color: '#e74c3c' },
        'meningitis': { name: 'Meningitis', color: '#c0392b' }
    };
    
    const info = diseaseInfo[disease] || { name: formatDiseaseName(disease), color: '#3498db' };
    
    // Get recommended tests for this disease
    const tests = getRecommendedTests(disease);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" style="border-left: 4px solid ${info.color}">
                <h2>${info.name}</h2>
                <button class="modal-close" onclick="document.getElementById('detailsModal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="symptom-analysis">
                    <!-- Matched Symptoms -->
                    <div class="analysis-section matched">
                        <div class="section-header matched-header">
                            <span class="section-icon">✅</span>
                            <h3>Matched Symptoms (${matchedSymptoms.length})</h3>
                        </div>
                        <div class="symptoms-list">
                            ${matchedSymptoms.length > 0 
                                ? matchedSymptoms.map(s => `<span class="symptom-tag matched-tag">${formatSymptomName(s)}</span>`).join('')
                                : '<p class="empty-message">None</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Missing Symptoms -->
                    <div class="analysis-section missing">
                        <div class="section-header missing-header">
                            <span class="section-icon">❌</span>
                            <h3>Missing Symptoms (${missingSymptoms.length})</h3>
                            <span class="section-hint">(Important)</span>
                        </div>
                        <div class="symptoms-list">
                            ${missingSymptoms.length > 0 
                                ? missingSymptoms.map(s => `<span class="symptom-tag missing-tag">${formatSymptomName(s)}</span>`).join('')
                                : '<p class="empty-message">All required symptoms match!</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Contradicting Symptoms -->
                    <div class="analysis-section contradicting">
                        <div class="section-header contradicting-header">
                            <span class="section-icon">⚠️</span>
                            <h3>Contradicting Symptoms (${contradictingSymptoms.length})</h3>
                            <span class="section-hint">(Negative Evidence)</span>
                        </div>
                        <div class="symptoms-list">
                            ${contradictingSymptoms.length > 0 
                                ? contradictingSymptoms.map(s => `<span class="symptom-tag contradicting-tag">${formatSymptomName(s)}</span>`).join('')
                                : '<p class="empty-message">No contradictions</p>'
                            }
                        </div>
                    </div>
                </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-primary" onclick="document.getElementById('detailsModal').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

