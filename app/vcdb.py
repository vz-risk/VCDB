from flask import Flask, render_template, request, redirect, url_for
vcdb = Flask(__name__)

@vcdb.route('/', methods=['GET','POST'])
def index():
    if request.method == 'GET':
        return render_template('index.html')
    else:
        options = ["theft_physical",
                "tampering_physical",
                "loss_error",
                "publishing_error_error",
                "misdelivery_error",
                "disposal_error_error",
                "privilege_abuse_misuse",
                "embezzlement_misuse",
                "dos_hacking",
                "intrusion_hacking",
                "malware_malware",
                "long_form"]
        if request.form['which_form'] in options:
            return request.form['which_form']
        else:
            return "invalid form selection"

if __name__ == "__main__":
    vcdb.run(debug=True, host="0.0.0.0")
