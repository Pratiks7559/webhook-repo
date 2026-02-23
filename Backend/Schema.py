class EventSchema:
    def __init__(self, request_id, author, action, from_branch, to_branch, timestamp):
        self.request_id = request_id
        self.author = author
        self.action = action
        self.from_branch = from_branch
        self.to_branch = to_branch
        self.timestamp = timestamp

    def to_mongo(self):
        return {
            'request_id': self.request_id,
            'author': self.author,
            'action': self.action,
            'from_branch': self.from_branch,
            'to_branch': self.to_branch,
            'timestamp': self.timestamp
        }

    @staticmethod
    def from_mongo(event_json):
        return EventSchema(
            request_id=event_json['request_id'],
            author=event_json['author'],
            action=event_json['action'],
            from_branch=event_json['from_branch'],
            to_branch=event_json['to_branch'],
            timestamp=event_json['timestamp']
        )
