from datetime import datetime

class GitHubEvent:
    def __init__(self, author, action, to_branch, from_branch="", request_id="", timestamp=None):
        self.author = author
        self.action = action  # PUSH, PULL_REQUEST, or MERGE
        self.from_branch = from_branch
        self.to_branch = to_branch
        self.request_id = request_id
        # Set timestamp if not provided
        self.timestamp = timestamp or self.format_current_time()

    @staticmethod
    def format_current_time():
        """Formats time like: 1st April 2021 - 9:30 PM UTC"""
        now = datetime.utcnow()
        day = now.day
        # Logic for st, nd, rd, th suffixes
        if 4 <= day <= 20 or 24 <= day <= 30:
            suffix = "th"
        else:
            suffix = ["st", "nd", "rd"][day % 10 - 1]
        
        return now.strftime(f"{day}{suffix} %B %Y - %I:%M %p UTC")

    def to_dict(self):
        """Convert object to dictionary for MongoDB insertion"""
        return {
            "request_id": self.request_id,
            "author": self.author,
            "action": self.action,
            "from_branch": self.from_branch,
            "to_branch": self.to_branch,
            "timestamp": self.timestamp
        }