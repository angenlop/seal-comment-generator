
// ==UserScript==
// @name         Seal# Comment Generator
// @namespace    http://tampermonkey.net/
// @version      0.9
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
                        background: linear-gradient(to bottom, #ffffff, #f8f9fa); padding: 18px;
                        border: 1px solid #dee2e6; z-index: 10000; border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 360px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 16px; color: #212529; font-weight: 600;">Seal Information</h3>
                    <button class="btn btn-small" id="closeBtn" style="padding: 2px 8px; font-size: 18px; line-height: 1; cursor: pointer;">×</button>
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: 500; color: #495057; display: block; margin-bottom: 4px;">Rack Asset/ Pallet ID #</label>
                    <input type="text" id="rackAsset" style="width: calc(100% - 16px); padding: 12px 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; box-sizing: border-box;"
                           placeholder="Enter ID number">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; font-weight: 500; color: #495057; display: block; margin-bottom: 4px;">Seal #</label>
                    <input type="text" id="sealNumber" style="width: calc(100% - 16px); padding: 12px 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; box-sizing: border-box;"
                           placeholder="Enter seal number">
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="font-size: 12px; font-weight: 500; color: #6c757d; display: block; margin-bottom: 4px;">Seal #2 <span style="font-weight: 400;">(optional)</span></label>
                    <input type="text" id="sealNumber2" style="width: calc(100% - 16px); padding: 12px 10px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; box-sizing: border-box;"
                           placeholder="Second seal (if applicable)">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">
                    <button class="btn btn-small btn-primary" id="nonMediaBtn" style="padding: 10px 4px; font-size: 11px; white-space: nowrap;">
                        Non-Intact
                    </button>
                    <button class="btn btn-small btn-primary" id="mediaBtn" style="padding: 10px 4px; font-size: 11px; white-space: nowrap;">
                        Intact Rack
                    </button>
                    <button class="btn btn-small btn-primary" id="palletBtn" style="padding: 10px 4px; font-size: 11px; white-space: nowrap;">
                        Pallet
                    </button>
                </div>

                <div style="border-top: 1px solid #dee2e6; padding-top: 10px;">
                    <div id="previewText" style="font-size: 11px; color: #6c757d; min-height: 30px; white-space: pre-wrap;"></div>
                </div>
            </div>
        `;

        const updatePreview = () => {
            const rackAsset = dialog.querySelector('#rackAsset').value;
            const sealNumber = dialog.querySelector('#sealNumber').value;
            const sealNumber2 = dialog.querySelector('#sealNumber2').value;
            const previewDiv = dialog.querySelector('#previewText');

            if (rackAsset || sealNumber || sealNumber2) {
                let sealText = sealNumber || '[pending]';
                if (sealNumber2) {
                    sealText += ' & ' + sealNumber2;
                }
                previewDiv.innerHTML = '<strong style="color: #495057;">Preview:</strong><br>' +
                    `ID: ${rackAsset || '[pending]'} | Seal: ${sealText}`;
            } else {
                previewDiv.textContent = 'Enter information to preview...';
            }
        };

        const rackInput = dialog.querySelector('#rackAsset');
        const sealInput = dialog.querySelector('#sealNumber');
        const sealInput2 = dialog.querySelector('#sealNumber2');
        const NL = String.fromCharCode(10);

        [rackInput, sealInput, sealInput2].forEach((input, index) => {
            input.addEventListener('input', updatePreview);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index === 0) {
                        sealInput.focus();
                    } else if (index === 1) {
                        sealInput2.focus();
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
            const sealNumber2 = sealInput2.value;
            if (rackAsset && sealNumber) {
                let sealText = 'Seal#: ' + sealNumber;
                if (sealNumber2) {
                    sealText = 'Seal#: ' + sealNumber + ' and ' + sealNumber2;
                }
                const lines = ['Rack Asset/ Pallet ID #: ' + rackAsset, 'Contains no customer data bearing drives and is sealed with ' + sealText, 'I bagged and securely sealed the rack with tamper evident seals according to standard and in preparation for RZ-to-RZ transfer to RRL.'];
                copyToClipboard(lines.join(NL));
                dialog.remove();
            } else {
                showNotification('Please fill in rack asset/pallet ID and at least one seal number', true);
            }
        });

        dialog.querySelector('#mediaBtn').addEventListener('click', () => {
            const rackAsset = rackInput.value;
            const sealNumber = sealInput.value;
            const sealNumber2 = sealInput2.value;
            if (rackAsset && sealNumber) {
                let sealText = 'Sealed with Seal#: ' + sealNumber;
                if (sealNumber2) {
                    sealText = 'Sealed with Seal#: ' + sealNumber + ' and ' + sealNumber2;
                }
                const lines = ['Rack Asset/ Pallet ID #: ' + rackAsset, sealText, 'Rack has drives and is being shipped intact for RRL to process.', 'Refer to step 11.1.1 of the Network SOP: https://policy.a2z.com/docs/59394/publication', 'I bagged and securely sealed the rack with tamper-evident seals according to standard and in preparation for RZ-to-RZ transfer to RRL.'];
                copyToClipboard(lines.join(NL));
                dialog.remove();
            } else {
                showNotification('Please fill in rack asset/pallet ID and at least one seal number', true);
            }
        });

        dialog.querySelector('#palletBtn').addEventListener('click', () => {
            const rackAsset = rackInput.value;
            const sealNumber = sealInput.value;
            const sealNumber2 = sealInput2.value;
            if (rackAsset && sealNumber) {
                dialog.remove();
                showPalletDialog(rackAsset, sealNumber, sealNumber2);
            } else {
                showNotification('Please fill in pallet ID and at least one seal number first', true);
            }
        });

        dialog.querySelector('#closeBtn').addEventListener('click', () => {
            dialog.remove();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });

        updatePreview();

        return dialog;
    }

    function showPalletDialog(palletId, seal1, seal2) {
        const palletDialog = document.createElement('div');
        palletDialog.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: linear-gradient(to bottom, #ffffff, #f8f9fa); padding: 18px;
                        border: 1px solid #dee2e6; z-index: 10001; border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 480px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 16px; color: #212529; font-weight: 600;">Pallet Format - Device List</h3>
                    <button class="btn btn-small" id="closePalletBtn" style="padding: 2px 8px; font-size: 18px; line-height: 1; cursor: pointer;">×</button>
                </div>

                <div style="background: #e9ecef; padding: 10px; border-radius: 4px; margin-bottom: 12px;">
                    <div style="font-size: 12px; color: #495057;"><strong>Pallet ID:</strong> ${palletId}</div>
                    <div style="font-size: 12px; color: #495057;"><strong>Seal(s):</strong> ${seal2 ? seal1 + ' and ' + seal2 : seal1}</div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="font-size: 12px; font-weight: 500; color: #495057; display: block; margin-bottom: 4px;">Device List (one per line)</label>
                    <textarea id="deviceList" style="width: calc(100% - 16px); padding: 8px; border: 1px solid #ced4da; border-radius: 4px; min-height: 120px; font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;"
                              placeholder="Example:&#10;Rack Asset: 12345&#10;Rack Asset: 67890&#10;Device: ABC123"></textarea>
                    <div style="font-size: 10px; color: #6c757d; margin-top: 4px;">
                        💡 Paste your list of rack assets or devices here
                    </div>
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-small" id="cancelPalletBtn" style="padding: 6px 16px;">Cancel</button>
                    <button class="btn btn-small btn-primary" id="completePalletBtn" style="padding: 6px 16px;">Complete</button>
                </div>
            </div>
        `;

        const NL = String.fromCharCode(10);
        const deviceListInput = palletDialog.querySelector('#deviceList');

        palletDialog.querySelector('#completePalletBtn').addEventListener('click', () => {
            const deviceList = deviceListInput.value.trim();
            if (!deviceList) {
                showNotification('Please enter at least one device', true);
                return;
            }

            let sealText = seal2 ? seal1 + ' and ' + seal2 : seal1;

            const lines = [
                'Pallet I.D.#: ' + palletId,
                'Sealed with Seal(s)#: ' + sealText,
                'These devices contain no customer data bearing drives.',
                'I have securely sealed the pallet with tamper-evident seals according to standard procedures in preparation for RZ-to-RZ transfer to RRL. The pallet contains devices from the following rack(s) with asset(s):',
                '',
                deviceList
            ];

            copyToClipboard(lines.join(NL));
            palletDialog.remove();
        });

        palletDialog.querySelector('#cancelPalletBtn').addEventListener('click', () => {
            palletDialog.remove();
        });

        palletDialog.querySelector('#closePalletBtn').addEventListener('click', () => {
            palletDialog.remove();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                palletDialog.remove();
            }
        });

        document.body.appendChild(palletDialog);
        deviceListInput.focus();
    }

    function addFormattingButton(container) {
        const button = document.createElement('button');
        button.innerHTML = '<i class="icon-edit"></i> Seal# Comment';
        button.className = 'btn btn-small';
        button.style.marginRight = '5px';
        button.title = 'Quick format seal information (Alt+R)';

        button.addEventListener('click', showDialog);
        container.insertBefore(button, container.firstChild);

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

