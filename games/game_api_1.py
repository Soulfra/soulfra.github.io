#!/usr/bin/env python3
"""Game API for create the ultimate prediction game where users bet on real world events"""

from flask import Flask, jsonify, request
import json
import sqlite3

app = Flask(__name__)

@app.route('/api/game/<game_id>/score', methods=['POST'])
def save_score(game_id):
    data = request.json
    # Save score logic
    return jsonify({"success": True, "score": data.get('score')})

@app.route('/api/game/<game_id>/leaderboard')
def get_leaderboard(game_id):
    # Return top scores
    return jsonify({"leaderboard": []})

if __name__ == '__main__':
    app.run(port=8000)
