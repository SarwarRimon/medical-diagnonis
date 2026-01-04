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
