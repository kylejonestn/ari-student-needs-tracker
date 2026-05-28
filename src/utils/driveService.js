/* ==========================================
   Aegis Gifted Tracker - Google Drive Pseudo-Database Service
   ========================================== */

/**
 * Service to handle Google Identity Services (GIS) OAuth 2.0 authentication
 * and direct fetch queries to the Google Drive API v3.
 */
export const driveService = {
  
  /**
   * Triggers the Google Identity Services OAuth popup to obtain an Access Token.
   * Assumes window.google is loaded (GIS script in index.html).
   */
  requestAccessToken(clientId, callback, onError) {
    if (!window.google) {
      onError("Google Identity Services script not loaded. Check internet connection.");
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send", // Access Drive files and send emails
        callback: (response) => {
          if (response.error) {
            onError(`Auth failed: ${response.error_description || response.error}`);
            return;
          }
          if (response.access_token) {
            // Calculate exact expiry timestamp
            const expiresAt = Date.now() + parseInt(response.expires_in, 10) * 1000;
            callback(response.access_token, expiresAt);
          }
        },
      });

      // Show the popup
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err) {
      onError(`Authorization setup failed: ${err.message}`);
    }
  },

  /**
   * Search for a file by name in Google Drive.
   * Restricts search to active (not trashed) files.
   */
  async findFile(accessToken, filename) {
    const q = encodeURIComponent(`name = '${filename}' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Search Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  },

  /**
   * Read file content from Google Drive by fileId.
   */
  async readFile(accessToken, fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Read Error: ${response.status} - ${errText}`);
    }

    return await response.json();
  },

  /**
   * Create a new file in Google Drive in two phases:
   * 1. Create file metadata to obtain a fileId.
   * 2. Upload the JSON content payload.
   */
  async createFile(accessToken, filename, content) {
    // Phase 1: Metadata
    const metadataUrl = "https://www.googleapis.com/drive/v3/files";
    const metaResponse = await fetch(metadataUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: filename,
        mimeType: "application/json",
      }),
    });

    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      throw new Error(`Google Drive Create Metadata Error: ${metaResponse.status} - ${errText}`);
    }

    const metaData = await metaResponse.json();
    const fileId = metaData.id;

    // Phase 2: Upload raw content
    await this.updateFile(accessToken, fileId, content);

    return fileId;
  },

  /**
   * Overwrite existing file content in Google Drive.
   */
  async updateFile(accessToken, fileId, content) {
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    
    const response = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive Update Content Error: ${response.status} - ${errText}`);
    }

    return true;
  },

  /**
   * Sanitizes and constructs the restricted data payload for 'parent-portal.json'
   * strictly omitting confidential screening details, teacher observations, or full notes.
   */
  segregateParentData(allData) {
    if (!allData || !allData.students) {
      return { students: [] };
    }

    const filteredStudents = allData.students.map(student => {
      // Extract ONLY safe public parameters
      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        school: student.school,
        classroomTeacher: student.classroomTeacher,
        status: student.status,
        iepReviewDate: student.iepReviewDate,
        reevalDueDate: student.reevalDueDate,
        accommodations: student.accommodations || [],
        
        // Expose public SEL information (theme & strategies, NO raw confidential facilitator journals!)
        selNeeds: student.selNeeds ? {
          type: student.selNeeds.type,
          strategies: student.selNeeds.strategies || [],
          // Provide only standard aggregate updates, omitting day-to-day logs
          logsCount: student.selNeeds.logs ? student.selNeeds.logs.length : 0
        } : null,

        // Expose formal parent-released progress reports
        progressReports: student.progressReports || []
      };
    });

    return {
      students: filteredStudents,
      lastUpdated: new Date().toISOString()
    };
  }
};
