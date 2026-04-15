// ==UserScript==
// @name         Seal# Comment Generator
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Format rack asset and seal information with enhanced UI
// @match        https://*.amazon.com/*
// @updateURL    https://raw.githubusercontent.com/angenlop/seal-comment-generator/main/seal-comment-generator.user.js
// @downloadURL  https://raw.githubusercontent.com/angenlop/seal-comment-generator/main/seal-comment-generator.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function waitForContainer() {
        const containerCheck = setInterval(() => {
            const container = document.querySelector('#issue-actions-pane');
            if (container) {
                clearInterval(containerCheck);
                addFormattingButton(container);
            }
        }, 500);

        setTimeout(() => clearInterval(containerCheck), 10000);
    }

    function createDialog() {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 20px; border: 1px solid #ccc; z-index: 10000;
                        border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-width: 300px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Seal Information</h3>
                    <button class="btn btn-small" id="closeBtn" style="padding: 0 5px;">×</button>
                </div>

                <div style="margin-bottom: 15px;">
                    <label>Rack Asset #:</label><br>
                    <input type="text" id="rackAsset" style="width: 100%; padding: 5px; margin-top: 5px;"
                           placeholder="Enter rack asset number">
                </div>

                <div style="margin-bottom: 20px;">
                    <label>Seal #:</label><br>
                    <input type="text" id="sealNumber" style="width: 100%; padding: 5px; margin-top: 5px;"
                           placeholder="Enter seal number">
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button class="btn btn-small btn-primary" id="nonMediaBtn" style="flex: 1;">
                        Non-Media Format
                    </button>
                    <button class="btn btn-small btn-primary" id="mediaBtn" style="flex: 1;">
                        Media Format
                    </button>
                </div>

                <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                    <div id="previewText" style="font-size: 12px; color: #666; margin-bottom: 10px; white-space: pre-wrap;"></div>
                </div>
            </div>
        `;

        const updatePreview = () => {
            const rackAsset = dialog.querySelector('#rackAsset').value;
            const sealNumber = dialog.querySelector('#sealNumber').value;
            const previewDiv = dialog.querySelector('#previewText');

            if (rackAsset || sealNumber) {
                previewDiv.innerHTML = '<strong>Preview:</strong><br>' +
                    `Rack Asset#: ${rackAsset || '[pending]'}<br>` +
                    `Seal#: ${sealNumber || '[pending]'}...`;
            } else {
                previewDiv.textContent = 'Enter rack asset and seal numbers to see preview...';
            }
        };

        // Add event listeners
        const rackInput = dialog.querySelector('#rackAsset');
        const sealInput = dialog.querySelector('#sealNumber');

        // Prevent auto-enter behavior and auto-focus next field
        [rackInput, sealInput].forEach((input, index) => {
            input.addEventListener('input', updatePreview);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index === 0) {
                        sealInput.focus();
                    }
                    if (rackInput.value && sealInput.value) {
                        showNotification('Please select format type', false);
                    }
                }
            });
        });

        dialog.querySelector('#nonMediaBtn').addEventListener('click', () => {
            const rackAsset = rackInput.value;
            const sealNumber = sealInput.value;
            if (rackAsset && sealNumber) {
                const text = `Rack Asset#: ${rackAsset}
Contains no customer data bearing drives and is sealed with Seal#: ${sealNumber}
I bagged and securely sealed the rack with tamper evident seals according to standard and in preparation for RZ to RZ transfer to Winston Wolfe.`;
                copyToClipboard(text);
                dialog.remove();
            } else {
                showNotification('Please fill in both fields', true);
            }
        });

        dialog.querySelector('#mediaBtn').addEventListener('click', () => {
            const rackAsset = rackInput.value;
            const sealNumber = sealInput.value;
            if (rackAsset && sealNumber) {
                const text = `Rack Asset#: ${rackAsset}
Rack has drives and is being shipped intact for Winston Wolfe to process.
Refer to step 11.1.1 of the Network SOP: https://policy.a2z.com/docs/59394/publication
Sealed with Seal#: ${sealNumber}`;
                copyToClipboard(text);
                dialog.remove();
            } else {
                showNotification('Please fill in both fields', true);
            }
        });

        dialog.querySelector('#closeBtn').addEventListener('click', () => {
            dialog.remove();
        });

        // Handle ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });

        // Initialize preview
        updatePreview();

        return dialog;
    }

    function addFormattingButton(container) {
        const button = document.createElement('button');
        button.innerHTML = '<i class="icon-edit"></i> Seal# Comment';
        button.className = 'btn btn-small';
        button.style.marginRight = '5px';
        button.title = 'Quick format seal information (Alt+R)';

        button.addEventListener('click', showDialog);
        container.insertBefore(button, container.firstChild);

        // Add keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'r') {
                showDialog();
            }
        });
    }

    function showDialog() {
        const dialog = createDialog();
        document.body.appendChild(dialog);
        dialog.querySelector('#rackAsset').focus();
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('✓ Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy to clipboard', true);
        });
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${isError ? '#dc3545' : '#28a745'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: fadeOut 2s forwards;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(10px); }
        }
    `;
    document.head.appendChild(style);

    waitForContainer();
})();
