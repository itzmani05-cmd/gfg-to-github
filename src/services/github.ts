export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface PushResult {
  success: boolean;
  message: string;
  url?: string;
}

export const githubApi = {
  headers: (token: string) => ({
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }),

  fetchUser: async (token: string): Promise<GitHubUser> => {
    const response = await fetch('https://api.github.com/user', {
      headers: githubApi.headers(token),
    });
    if (!response.ok) {
      throw new Error(`GitHub auth failed: ${response.statusText}`);
    }
    return response.json();
  },

  fetchRepos: async (token: string): Promise<GitHubRepo[]> => {
    // Fetch up to 100 repositories, sorted by updated time
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: githubApi.headers(token),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch repositories: ${response.statusText}`);
    }
    const repos: GitHubRepo[] = await response.json();
    // Return only repos where user has push access (optional but good, let's keep all first)
    return repos;
  },

  fetchBranches: async (token: string, fullName: string): Promise<GitHubBranch[]> => {
    const response = await fetch(`https://api.github.com/repos/${fullName}/branches?per_page=100`, {
      headers: githubApi.headers(token),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.statusText}`);
    }
    return response.json();
  },

  getFileSha: async (token: string, fullName: string, branch: string, path: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}/contents/${path}?ref=${branch}`, {
        headers: githubApi.headers(token),
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Error checking file: ${response.statusText}`);
      }
      const data = await response.json();
      return data.sha || null;
    } catch {
      return null;
    }
  },

  pushFile: async (
    token: string,
    fullName: string,
    branch: string,
    path: string,
    content: string,
    commitMessage: string,
    existingSha: string | null = null
  ): Promise<PushResult> => {
    try {
      // 1. Check if file exists to get SHA if not provided
      let sha = existingSha;
      if (!sha) {
        sha = await githubApi.getFileSha(token, fullName, branch, path);
      }

      // Convert content to Base64 (using btoa with UTF-8 encoding compatibility)
      // Standard btoa fails on non-Latin1 characters, so we handle UTF-8:
      const utf8Bytes = new TextEncoder().encode(content);
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
      const base64Content = btoa(binaryString);

      const body: any = {
        message: commitMessage,
        content: base64Content,
        branch,
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(`https://api.github.com/repos/${fullName}/contents/${path}`, {
        method: 'PUT',
        headers: githubApi.headers(token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText);
      }

      const resData = await response.json();
      return {
        success: true,
        message: sha ? 'File updated successfully' : 'File created successfully',
        url: resData.content?.html_url,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to push file to GitHub',
      };
    }
  }
};
