from flask import Flask, render_template, request, redirect, url_for
vcdb = Flask(__name__)

@vcdb.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    vcdb.run(debug=True, host="0.0.0.0")
